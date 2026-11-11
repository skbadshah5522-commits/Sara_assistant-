/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AssistantState, PermissionsState, IntentActionLog, Contact } from './types/assistant';
import { float32ToPCM16, arrayBufferToBase64, LiveAudioPlayer } from './services/audioUtils';
import { ToolExecutionEngine } from './services/toolExecutionEngine';
import { WakeWordDetector } from './services/wakeWordDetector';
import { SaraOrbCanvas } from './components/SaraOrbCanvas';
import { AndroidForegroundNotification } from './components/AndroidForegroundNotification';
import { PermissionsSheet } from './components/PermissionsSheet';
import { AndroidIntentHUD } from './components/AndroidIntentHUD';
import { AndroidProjectExplorer } from './components/AndroidProjectExplorer';
import { INITIAL_CONTACTS, INSTALLED_APPS } from './services/mockAndroidData';
import {
  Shield,
  Code2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  PlaySquare,
  AlertCircle
} from 'lucide-react';
import { AndroidDeviceView } from './components/AndroidDeviceView';

export default function App() {
  // Assistant UI State & View Mode
  const [viewMode, setViewMode] = useState<'device' | 'orb'>('device');
  const [currentSimulatedApp, setCurrentSimulatedApp] = useState<string>('home');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [transcriptSnippet, setTranscriptSnippet] = useState<string>('');
  const [isForegroundServiceRunning, setIsForegroundServiceRunning] = useState<boolean>(true);
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState<boolean>(false);
  const [isProjectExplorerOpen, setIsProjectExplorerOpen] = useState<boolean>(false);

  // Runtime Permissions State
  const [permissions, setPermissions] = useState<PermissionsState>({
    recordAudio: true,
    readContacts: true,
    callPhone: true,
    postNotifications: true
  });

  // Intent Logs & Active Overlays
  const [intentLogs, setIntentLogs] = useState<IntentActionLog[]>([]);
  const [activeCall, setActiveCall] = useState<Contact | null>(null);
  const [activeWhatsApp, setActiveWhatsApp] = useState<{ contact: Contact; message: string } | null>(null);
  const [activeGmail, setActiveGmail] = useState<{ recipient: string; subject: string; body: string } | null>(null);
  const [activeApp, setActiveApp] = useState<{ name: string; packageName: string } | null>(null);

  // Audio References
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const liveAudioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const toolEngineRef = useRef<ToolExecutionEngine | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  const thinkingTimeoutRef = useRef<any>(null);

  // Initialize Tool Engine with callbacks
  useEffect(() => {
    toolEngineRef.current = new ToolExecutionEngine(permissions, {
      onIntentExecuted: (log) => {
        setIntentLogs((prev) => [log, ...prev]);
      },
      onTriggerCallOverlay: (contact) => {
        setActiveCall(contact);
        setCurrentSimulatedApp('phone');
      },
      onTriggerWhatsAppOverlay: (contact, message) => {
        setActiveWhatsApp({ contact, message });
        setCurrentSimulatedApp('whatsapp');
      },
      onTriggerGmailOverlay: (recipient, subject, body) => {
        setActiveGmail({ recipient, subject, body });
        setCurrentSimulatedApp('gmail');
      },
      onTriggerAppOverlay: (appName, packageName) => {
        setActiveApp({ name: appName, packageName });
        const lower = (appName + ' ' + packageName).toLowerCase();
        if (lower.includes('youtube')) setCurrentSimulatedApp('youtube');
        else if (lower.includes('calculator')) setCurrentSimulatedApp('calculator');
        else if (lower.includes('whatsapp')) setCurrentSimulatedApp('whatsapp');
        else if (lower.includes('gmail') || lower.includes('mail')) setCurrentSimulatedApp('gmail');
        else if (lower.includes('settings')) setCurrentSimulatedApp('settings');
      }
    });
  }, []);

  // Update permissions in engine when changed
  useEffect(() => {
    if (toolEngineRef.current) {
      toolEngineRef.current.updatePermissions(permissions);
    }
  }, [permissions]);

  // Initialize Live Audio Player (for 24kHz model output)
  useEffect(() => {
    liveAudioPlayerRef.current = new LiveAudioPlayer((isPlaying) => {
      if (isPlaying) {
        setAssistantState('speaking');
      } else {
        setAssistantState('idle');
      }
    });

    return () => {
      liveAudioPlayerRef.current?.close();
    };
  }, []);

  // Initialize Local Wake Word Detector
  useEffect(() => {
    wakeWordDetectorRef.current = new WakeWordDetector(
      () => {
        // "Sara" detected!
        if (isWakeWordEnabled && isForegroundServiceRunning) {
          handleWakeWordTrigger();
        }
      },
      (heardText) => {
        // Optional live preview of heard speech
        if (assistantState === 'listening') {
          setTranscriptSnippet(heardText);
        }
      }
    );

    if (isWakeWordEnabled && isForegroundServiceRunning) {
      wakeWordDetectorRef.current.start();
    }

    return () => {
      wakeWordDetectorRef.current?.stop();
    };
  }, [isWakeWordEnabled, isForegroundServiceRunning]);

  // Establish Live WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;
    console.log('Connecting to Sara Live WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Sara Live Audio Engine');
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        // 1. Audio stream chunks from Gemini Live
        if (msg.type === 'audio' && msg.audio) {
          clearTimeout(thinkingTimeoutRef.current);
          setAssistantState('speaking');
          liveAudioPlayerRef.current?.playChunk(msg.audio);
        }

        // 2. Interruption event (user spoke during playback)
        if (msg.type === 'interrupted') {
          console.log('Sara interrupted by user voice');
          liveAudioPlayerRef.current?.stopAll();
          setAssistantState('listening');
        }

        // 3. Transcript
        if (msg.type === 'transcript') {
          if (msg.text) {
            setTranscriptSnippet(msg.text);
            clearTimeout(thinkingTimeoutRef.current);
            // If audio was not already playing from Live PCM chunks, speak via SpeechSynthesis
            if (assistantState !== 'speaking' && 'speechSynthesis' in window && !isMuted) {
              setAssistantState('speaking');
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(msg.text);
              utterance.rate = 1.05;
              utterance.pitch = 1.15;
              utterance.onend = () => setAssistantState('idle');
              utterance.onerror = () => setAssistantState('idle');
              window.speechSynthesis.speak(utterance);
            }
          }
        }

        // Status update
        if (msg.type === 'status') {
          console.log('Sara status:', msg.status, msg.message);
        }

        // 4. Android Tool Calls from Gemini
        if (msg.type === 'tool_call' && toolEngineRef.current) {
          clearTimeout(thinkingTimeoutRef.current);
          setAssistantState('thinking');
          const result = await toolEngineRef.current.executeTool(msg.name, msg.args);

          // Send tool execution result back to Gemini Live
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'tool_response',
                id: msg.id,
                name: msg.name,
                response: result
              })
            );
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('WebSocket error, falling back to local speech engine:', err);
    };

    ws.onclose = () => {
      console.log('Sara Live WebSocket closed');
    };
  };

  // Start continuous 16kHz PCM mic capture
  const startMicCapture = async () => {
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state === 'running') {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      micAnalyserRef.current = analyser;

      // 4096 samples at 16kHz gives ~256ms audio chunks
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(ctx.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);

        // Check user speech barge-in (interruption detection)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += Math.abs(inputData[i]);
        const avgEnergy = sum / inputData.length;

        // Barge-in threshold: if user talks while Sara is speaking, interrupt immediately!
        if (avgEnergy > 0.05) {
          if (assistantState === 'speaking') {
            console.log('Local barge-in: user spoke loudly during playback!');
            liveAudioPlayerRef.current?.stopAll();
            setAssistantState('listening');
          }
        }

        // Send 16kHz PCM16 buffer to Gemini Live WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const pcm16Buffer = float32ToPCM16(inputData);
          const base64Audio = arrayBufferToBase64(pcm16Buffer);
          wsRef.current.send(
            JSON.stringify({
              type: 'audio',
              audio: base64Audio
            })
          );
        }
      };

      console.log('Mic capture active at 16kHz PCM');
    } catch (err: any) {
      console.warn('Microphone access note:', err.message);
    }
  };

  const stopMicCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    micAnalyserRef.current = null;
  };

  // Trigger wake word action
  const handleWakeWordTrigger = async () => {
    console.log('Wake-word "Sara" activated!');
    connectWebSocket();
    await startMicCapture();

    // Play subtle futuristic activation chime
    playActivationChime();

    setAssistantState('listening');
    setTranscriptSnippet('Sara is listening...');

    // If WebSocket is open, send wake trigger
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'wake_word' }));
    }
  };

  // Play a soft high-tech synth chime on wake
  const playActivationChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // ignore
    }
  };

  // Central Orb Tap Handler
  const handleOrbClick = async () => {
    if (assistantState === 'speaking') {
      // Interruption / barge-in
      liveAudioPlayerRef.current?.stopAll();
      setAssistantState('listening');
      setTranscriptSnippet('Listening...');
      return;
    }

    if (assistantState === 'idle') {
      await handleWakeWordTrigger();
      return;
    }

    if (assistantState === 'listening') {
      // Finished speaking, transition to thinking
      setAssistantState('thinking');
      setTranscriptSnippet('Processing with Gemini Live...');
      thinkingTimeoutRef.current = setTimeout(() => {
        setAssistantState((curr) => (curr === 'thinking' ? 'idle' : curr));
      }, 5000);
      return;
    }
  };

  // Execute quick voice prompts for demonstration
  const handleQuickPrompt = async (promptText: string) => {
    setTranscriptSnippet(promptText);
    setAssistantState('thinking');
    connectWebSocket();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text: promptText }));
    } else {
      // Fallback via HTTP
      try {
        const res = await fetch('/api/chat-fallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: promptText })
        });
        const data = await res.json();
        setTranscriptSnippet(data.reply);
        setAssistantState('speaking');

        // Speak via Web Speech Synthesis if available
        if ('speechSynthesis' in window && !isMuted) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.reply);
          utterance.rate = 1.05;
          utterance.pitch = 1.15; // youthful female tone
          utterance.onend = () => setAssistantState('idle');
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setAssistantState('idle'), 3500);
        }
      } catch (e) {
        setAssistantState('idle');
      }
    }
  };

  // Toggle Permissions
  const handleTogglePermission = (key: keyof PermissionsState) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGrantAllPermissions = () => {
    setPermissions({
      recordAudio: true,
      readContacts: true,
      callPhone: true,
      postNotifications: true
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background futuristic grid & ambient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(56,189,248,0.12),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_50%)]" />

      {/* TOP BAR: Android Status & Action Controls */}
      <header className="relative z-30 w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-3">
        {/* Top App Header with Quick Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 text-black font-bold" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>Sara Assistant</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  v2.0 Native Core
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Zero-Touch Gemini Live Voice Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Permissions Button */}
            <button
              onClick={() => setIsPermissionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Permissions</span>
            </button>

            {/* Android Project Studio / Source Code Explorer */}
            <button
              onClick={() => setIsProjectExplorerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-all shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Android Studio Code</span>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                liveAudioPlayerRef.current?.setMuted(nextMute);
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Persistent Android Foreground Service Notification Banner */}
        <AndroidForegroundNotification
          isServiceRunning={isForegroundServiceRunning}
          onToggleService={() => {
            const next = !isForegroundServiceRunning;
            setIsForegroundServiceRunning(next);
            if (!next) {
              wakeWordDetectorRef.current?.stop();
              stopMicCapture();
              setAssistantState('idle');
            } else {
              if (isWakeWordEnabled) wakeWordDetectorRef.current?.start();
            }
          }}
          wakeWordEnabled={isWakeWordEnabled}
          onToggleWakeWord={() => {
            const next = !isWakeWordEnabled;
            setIsWakeWordEnabled(next);
            if (!next) {
              wakeWordDetectorRef.current?.stop();
            } else if (isForegroundServiceRunning) {
              wakeWordDetectorRef.current?.start();
            }
          }}
          onSimulateWakeWord={handleWakeWordTrigger}
          onOpenPermissions={() => setIsPermissionsOpen(true)}
        />
      </header>

      {/* VIEW MODE SELECTOR: Device Mode vs Orb Mode */}
      <div className="relative z-30 w-full max-w-sm mx-auto px-4 mt-2 flex justify-center">
        <div className="p-1 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center shadow-lg backdrop-blur-md">
          <button
            onClick={() => setViewMode('device')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'device'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive Device</span>
          </button>
          <button
            onClick={() => setViewMode('orb')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'orb'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voice Orb Studio</span>
          </button>
        </div>
      </div>

      {/* CENTER: Main Stage - Device Simulator or Fullscreen Glowing Orb */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-4">
        {viewMode === 'device' ? (
          <div className="w-full flex justify-center animate-fade-in">
            <AndroidDeviceView
              currentApp={currentSimulatedApp}
              onNavigateApp={(app) => setCurrentSimulatedApp(app)}
              assistantState={assistantState}
              onOrbClick={handleOrbClick}
              transcriptSnippet={transcriptSnippet}
              activeCallContact={activeCall}
              onEndCall={() => setActiveCall(null)}
              whatsappData={activeWhatsApp}
              gmailData={activeGmail}
              wakeWordSimulate={handleWakeWordTrigger}
            />
          </div>
        ) : (
          <div className="w-full max-w-lg flex flex-col items-center animate-fade-in">
            <SaraOrbCanvas
              state={assistantState}
              micAnalyser={micAnalyserRef.current}
              outputAnalyser={liveAudioPlayerRef.current?.getAnalyser() || null}
              onOrbClick={handleOrbClick}
              isBackgroundServiceActive={isForegroundServiceRunning}
              transcriptSnippet={transcriptSnippet}
            />
          </div>
        )}

        {/* Quick Voice Intent Prompts */}
        <div className="w-full max-w-xl mt-10 space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-pink-400" />
              Sassy Voice Test Prompts
            </span>
            <span className="text-[10px] text-slate-500">Tap to speak or test intent</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            <button
              onClick={() => handleQuickPrompt('Sara, open YouTube for me.')}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1.5"
            >
              <PlaySquare className="w-3.5 h-3.5 text-rose-400" />
              <span>&ldquo;Open YouTube&rdquo;</span>
            </button>

            <button
              onClick={() => handleQuickPrompt('Call Alex Rivera right now.')}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>&ldquo;Call Alex&rdquo;</span>
            </button>

            <button
              onClick={() => handleQuickPrompt('Send a WhatsApp to Mom saying I will be home by 8 PM.')}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>&ldquo;WhatsApp Mom&rdquo;</span>
            </button>

            <button
              onClick={() => handleQuickPrompt('Why are you so sassy today?')}
              className="shrink-0 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>&ldquo;Why so sassy?&rdquo;</span>
            </button>
          </div>
        </div>
      </main>

      {/* BOTTOM SECTION: Android Intent HUD & Telemetry Logs */}
      <footer className="relative z-30 w-full max-w-4xl mx-auto px-4 pb-6 space-y-3">
        <AndroidIntentHUD
          logs={intentLogs}
          activeCall={activeCall}
          onEndCall={() => setActiveCall(null)}
          activeWhatsApp={activeWhatsApp}
          onCloseWhatsApp={() => setActiveWhatsApp(null)}
          activeGmail={activeGmail}
          onCloseGmail={() => setActiveGmail(null)}
          activeApp={activeApp}
          onCloseApp={() => setActiveApp(null)}
        />
      </footer>

      {/* Permissions Onboarding Modal */}
      <PermissionsSheet
        isOpen={isPermissionsOpen}
        onClose={() => setIsPermissionsOpen(false)}
        permissions={permissions}
        onTogglePermission={handleTogglePermission}
        onGrantAll={handleGrantAllPermissions}
      />

      {/* Android Studio Project Explorer / Exporter */}
      <AndroidProjectExplorer
        isOpen={isProjectExplorerOpen}
        onClose={() => setIsProjectExplorerOpen(false)}
      />
    </div>
  );
}
