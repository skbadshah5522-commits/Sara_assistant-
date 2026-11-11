import React, { useState, useEffect } from 'react';
import { IntentActionLog, Contact } from '../types/assistant';
import {
  Phone,
  PhoneOff,
  Mic,
  Volume2,
  ExternalLink,
  MessageCircle,
  Mail,
  PlaySquare,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AndroidIntentHUDProps {
  logs: IntentActionLog[];
  activeCall: Contact | null;
  onEndCall: () => void;
  activeWhatsApp: { contact: Contact; message: string } | null;
  onCloseWhatsApp: () => void;
  activeGmail: { recipient: string; subject: string; body: string } | null;
  onCloseGmail: () => void;
  activeApp: { name: string; packageName: string } | null;
  onCloseApp: () => void;
}

export const AndroidIntentHUD: React.FC<AndroidIntentHUDProps> = ({
  logs,
  activeCall,
  onEndCall,
  activeWhatsApp,
  onCloseWhatsApp,
  activeGmail,
  onCloseGmail,
  activeApp,
  onCloseApp
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isLogExpanded, setIsLogExpanded] = useState(false);

  useEffect(() => {
    let timer: any;
    if (activeCall) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeCall]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <>
      {/* 1. NATIVE SIMULATED CALL OVERLAY */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-black border border-slate-800 rounded-3xl p-8 flex flex-col items-center shadow-2xl text-white">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 mb-4 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ACTION_CALL Active
            </span>

            {/* Avatar */}
            <div
              className={`w-28 h-28 rounded-full bg-gradient-to-tr ${activeCall.avatarColor} flex items-center justify-center text-4xl font-bold shadow-xl shadow-cyan-900/40 mb-4 ring-4 ring-white/10`}
            >
              {activeCall.name.charAt(0)}
            </div>

            <h3 className="text-2xl font-bold text-white text-center">{activeCall.name}</h3>
            <p className="text-sm text-slate-400 mt-1 font-mono">{activeCall.phone}</p>
            <p className="text-xs text-emerald-400 font-medium mt-3 font-mono">
              Calling... {formatSeconds(callDuration)}
            </p>

            {/* In-Call Actions */}
            <div className="grid grid-cols-3 gap-6 mt-8 w-full max-w-xs">
              <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300">
                <Mic className="w-5 h-5" />
                <span className="text-[11px]">Mute</span>
              </button>
              <button className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300">
                <Volume2 className="w-5 h-5" />
                <span className="text-[11px]">Speaker</span>
              </button>
              <button
                onClick={onEndCall}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-[11px]">End</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. NATIVE SIMULATED WHATSAPP OVERLAY */}
      {activeWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#111b21] border border-emerald-900/60 rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="bg-[#202c33] p-4 flex items-center justify-between border-b border-[#222e35]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeWhatsApp.contact.avatarColor} flex items-center justify-center font-bold text-sm`}
                >
                  {activeWhatsApp.contact.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{activeWhatsApp.contact.name}</h4>
                  <p className="text-[11px] text-[#8696a0]">{activeWhatsApp.contact.phone}</p>
                </div>
              </div>
              <button
                onClick={onCloseWhatsApp}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#8696a0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-[#0b141a] min-h-[160px] flex flex-col justify-end">
              <span className="text-[10px] text-center text-[#8696a0] mb-3 font-mono">
                INTENT DISPATCH: android.intent.action.VIEW (WhatsApp)
              </span>
              <div className="self-end bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%] shadow-md">
                <p className="text-sm">{activeWhatsApp.message}</p>
                <span className="text-[10px] text-[#8696a0] block text-right mt-1">Just now ✓✓</span>
              </div>
            </div>

            <div className="p-4 bg-[#202c33] flex items-center justify-between gap-3">
              <a
                href={`https://api.whatsapp.com/send?phone=${activeWhatsApp.contact.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(activeWhatsApp.message)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Real WhatsApp</span>
              </a>
              <button
                onClick={onCloseWhatsApp}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NATIVE SIMULATED GMAIL OVERLAY */}
      {activeGmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="bg-slate-800/90 p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2 text-rose-400">
                <Mail className="w-5 h-5" />
                <span className="text-sm font-semibold text-white">Gmail • ACTION_SENDTO</span>
              </div>
              <button onClick={onCloseGmail} className="p-1 rounded-full hover:bg-white/10 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">To:</span>
                <p className="text-sm font-medium text-white">{activeGmail.recipient}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-mono">Subject:</span>
                <p className="text-sm font-semibold text-cyan-300">{activeGmail.subject}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-mono mb-1">Message Body:</span>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{activeGmail.body}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-800/50 flex items-center justify-between">
              <a
                href={`mailto:${activeGmail.recipient}?subject=${encodeURIComponent(activeGmail.subject)}&body=${encodeURIComponent(activeGmail.body)}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Email App</span>
              </a>
              <button
                onClick={onCloseGmail}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. NATIVE SIMULATED APP LAUNCH OVERLAY */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-white text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/30">
              <PlaySquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{activeApp.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">{activeApp.packageName}</p>
            <p className="text-xs text-cyan-400 mt-3 font-semibold">
              Intent.FLAG_ACTIVITY_NEW_TASK Dispatched
            </p>
            <button
              onClick={onCloseApp}
              className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold text-xs text-white"
            >
              Return to Sara
            </button>
          </div>
        </div>
      )}

      {/* 5. FLOATING ANDROID INTENT TELEMETRY DRAWER */}
      <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl overflow-hidden backdrop-blur-md">
        <button
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">Android Intent Activity Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
              {logs.length} Executed
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px]">{isLogExpanded ? 'Hide Details' : 'Show Logs'}</span>
            {isLogExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isLogExpanded && (
          <div className="p-3 border-t border-slate-800/80 max-h-52 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-2">
                No tools executed yet. Ask Sara: &ldquo;Call Alex&rdquo;, &ldquo;Open YouTube&rdquo;, or &ldquo;WhatsApp Mom&rdquo;!
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-cyan-400">{log.toolName}()</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] truncate max-w-xs sm:max-w-md">
                      {log.intentAction} &rarr; {JSON.stringify(log.parameters)}
                    </p>
                    {log.resultMessage && (
                      <p className="text-[11px] text-slate-400">{log.resultMessage}</p>
                    )}
                  </div>
                  <div>
                    {log.status === 'success' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    ) : log.status === 'permission_denied' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> DENIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950 text-amber-400">
                        {log.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
};
