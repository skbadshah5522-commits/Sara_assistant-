import React, { useEffect, useRef } from 'react';
import { AssistantState } from '../types/assistant';
import { Mic, Volume2, Sparkles, Brain, Radio } from 'lucide-react';

interface SaraOrbCanvasProps {
  state: AssistantState;
  micAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  onOrbClick: () => void;
  isBackgroundServiceActive: boolean;
  transcriptSnippet?: string;
}

export const SaraOrbCanvas: React.FC<SaraOrbCanvasProps> = ({
  state,
  micAnalyser,
  outputAnalyser,
  onOrbClick,
  isBackgroundServiceActive,
  transcriptSnippet
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const micDataArray = new Uint8Array(128);
    const outputDataArray = new Uint8Array(128);

    const render = () => {
      time += 0.035;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.22;

      // Frequency analysis
      let micEnergy = 0;
      if (micAnalyser && state === 'listening') {
        micAnalyser.getByteFrequencyData(micDataArray);
        let sum = 0;
        for (let i = 0; i < micDataArray.length; i++) sum += micDataArray[i];
        micEnergy = sum / (micDataArray.length * 255);
      }

      let outputEnergy = 0;
      if (outputAnalyser && state === 'speaking') {
        outputAnalyser.getByteFrequencyData(outputDataArray);
        let sum = 0;
        for (let i = 0; i < outputDataArray.length; i++) sum += outputDataArray[i];
        outputEnergy = sum / (outputDataArray.length * 255);
      }

      // STATE 1: IDLE - Slow subtle breathing glow
      if (state === 'idle') {
        const breath = Math.sin(time * 1.5) * 8;
        const outerRadius = baseRadius + 30 + breath;

        // Outer ambient glow
        const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, outerRadius + 40);
        glowGrad.addColorStop(0, 'rgba(147, 51, 234, 0.45)'); // purple
        glowGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.25)'); // pink
        glowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius + 40, 0, Math.PI * 2);
        ctx.fill();

        // Subtle rotating stardust dots
        for (let i = 0; i < 12; i++) {
          const angle = time * 0.4 + (i * Math.PI) / 6;
          const dist = baseRadius + 45 + Math.sin(time * 2 + i) * 12;
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 242, 254, 0.7)' : 'rgba(254, 0, 122, 0.7)';
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 8;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // STATE 2: LISTENING - Active listening waveform responding to mic input
      else if (state === 'listening') {
        const pulse = 10 + micEnergy * 40;
        const listenRadius = baseRadius + pulse;

        // Dynamic reactive frequency bars in circular array
        const barCount = 48;
        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 + time * 0.3;
          const dataIndex = Math.floor((i / barCount) * micDataArray.length * 0.75);
          const freqVal = (micDataArray[dataIndex] || 0) / 255;
          const barHeight = 8 + freqVal * 55 + Math.sin(time * 4 + i) * 6;

          const r1 = listenRadius + 5;
          const r2 = r1 + barHeight;

          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.strokeStyle = i % 2 === 0 ? `rgba(0, 242, 254, ${0.4 + freqVal * 0.6})` : `rgba(168, 85, 247, ${0.4 + freqVal * 0.6})`;
          ctx.stroke();
        }

        // Active listening radar wave
        const radarDist = (time * 60) % 90;
        ctx.beginPath();
        ctx.arc(cx, cy, listenRadius + radarDist, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${Math.max(0, 0.6 - radarDist / 90)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // STATE 3: THINKING/PROCESSING - Pulsing neon ring and orbital particle acceleration
      else if (state === 'thinking') {
        const thinkRadius = baseRadius + 18;

        // Dual counter-rotating neon rings
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, thinkRadius + 12, time * 2, time * 2 + Math.PI * 1.4);
        ctx.strokeStyle = '#00f2fe';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 14;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, thinkRadius + 22, -time * 2.8, -time * 2.8 + Math.PI * 1.2);
        ctx.strokeStyle = '#fe007a';
        ctx.shadowColor = '#fe007a';
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Orbiting energy nodes
        for (let i = 0; i < 4; i++) {
          const orbitAngle = time * 3 + (i * Math.PI) / 2;
          const ox = cx + Math.cos(orbitAngle) * (thinkRadius + 16);
          const oy = cy + Math.sin(orbitAngle) * (thinkRadius + 16);
          ctx.beginPath();
          ctx.arc(ox, oy, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // STATE 4: SPEAKING - Dynamic audio wave matching Sara's output stream
      else if (state === 'speaking') {
        const speakPulse = outputEnergy * 50;
        const speakRadius = baseRadius + 12;

        // Multi-harmonic undulating wave perimeter
        for (let waveIdx = 0; waveIdx < 3; waveIdx++) {
          ctx.beginPath();
          const points = 72;
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const dataIndex = Math.floor((i / points) * outputDataArray.length);
            const freq = (outputDataArray[dataIndex] || 0) / 255;
            const harmonic =
              Math.sin(angle * 6 + time * 5 + waveIdx) * (10 + freq * 35) +
              Math.cos(angle * 4 - time * 4) * (6 + freq * 20);

            const r = speakRadius + 16 + waveIdx * 12 + harmonic + speakPulse;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle =
            waveIdx === 0
              ? 'rgba(254, 0, 122, 0.85)'
              : waveIdx === 1
              ? 'rgba(168, 85, 247, 0.7)'
              : 'rgba(0, 242, 254, 0.6)';
          ctx.shadowColor = waveIdx === 0 ? '#fe007a' : '#00f2fe';
          ctx.shadowBlur = 12;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // CENTRAL CORE ORB (Common to all states, gradient varies)
      const coreGrad = ctx.createRadialGradient(cx - baseRadius * 0.25, cy - baseRadius * 0.25, 5, cx, cy, baseRadius);
      if (state === 'idle') {
        coreGrad.addColorStop(0, '#38bdf8');
        coreGrad.addColorStop(0.4, '#818cf8');
        coreGrad.addColorStop(0.85, '#4c1d95');
        coreGrad.addColorStop(1, '#0f172a');
      } else if (state === 'listening') {
        coreGrad.addColorStop(0, '#22d3ee');
        coreGrad.addColorStop(0.45, '#06b6d4');
        coreGrad.addColorStop(0.85, '#0e7490');
        coreGrad.addColorStop(1, '#042f2e');
      } else if (state === 'thinking') {
        coreGrad.addColorStop(0, '#f472b6');
        coreGrad.addColorStop(0.45, '#c084fc');
        coreGrad.addColorStop(0.85, '#6b21a8');
        coreGrad.addColorStop(1, '#2e1065');
      } else {
        // speaking
        coreGrad.addColorStop(0, '#fb7185');
        coreGrad.addColorStop(0.4, '#f43f5e');
        coreGrad.addColorStop(0.8, '#881337');
        coreGrad.addColorStop(1, '#1e1b4b');
      }

      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = state === 'speaking' ? '#f43f5e' : state === 'listening' ? '#06b6d4' : '#818cf8';
      ctx.shadowBlur = 24;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner glass highlight arc
      ctx.beginPath();
      ctx.ellipse(cx, cy - baseRadius * 0.45, baseRadius * 0.55, baseRadius * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fill();

      // Outer bezel ring
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state, micAnalyser, outputAnalyser]);

  // Status badge config
  const getStatusBadge = () => {
    switch (state) {
      case 'listening':
        return {
          label: 'LISTENING • SPEAK NOW',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Mic className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
        };
      case 'thinking':
        return {
          label: 'THINKING • PROCESSING INTENT',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Brain className="w-3.5 h-3.5 animate-spin text-purple-400" />
        };
      case 'speaking':
        return {
          label: 'SARA SPEAKING • BARGE-IN ACTIVE',
          color: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
          icon: <Volume2 className="w-3.5 h-3.5 animate-bounce text-pink-400" />
        };
      default:
        return {
          label: isBackgroundServiceActive ? "IDLE • SAY 'SARA' TO WAKE" : 'TAP ORB OR SAY SARA',
          color: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="relative w-full max-w-md aspect-square flex items-center justify-center select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-600/10 via-purple-600/15 to-pink-600/10 blur-3xl pointer-events-none" />

      {/* HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer relative z-10 transition-transform active:scale-95 duration-150"
        onClick={onOrbClick}
      />

      {/* Center Interactive Icon Overlay */}
      <div
        onClick={onOrbClick}
        className="absolute z-20 flex flex-col items-center justify-center cursor-pointer pointer-events-auto transform transition-transform hover:scale-105 active:scale-90"
      >
        <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-xl shadow-black/60">
          {state === 'listening' ? (
            <Mic className="w-7 h-7 text-cyan-300 animate-pulse" />
          ) : state === 'speaking' ? (
            <Volume2 className="w-7 h-7 text-pink-300 animate-pulse" />
          ) : state === 'thinking' ? (
            <Radio className="w-7 h-7 text-purple-300 animate-spin" />
          ) : (
            <Mic className="w-7 h-7 text-white/90" />
          )}
        </div>
        <span className="mt-2 text-[11px] font-semibold tracking-widest uppercase text-white/80 drop-shadow">
          {state === 'speaking' ? 'INTERRUPT' : state === 'listening' ? 'LISTENING' : 'SARA'}
        </span>
      </div>

      {/* State Status Capsule */}
      <div className="absolute -bottom-4 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-mono tracking-wider font-semibold backdrop-blur-md shadow-lg ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>
        {transcriptSnippet && (
          <p className="text-xs text-slate-400 font-medium italic max-w-xs text-center truncate drop-shadow">
            &ldquo;{transcriptSnippet}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
};
