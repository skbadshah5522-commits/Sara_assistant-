import React from 'react';
import { ShieldCheck, Mic, Bell, Zap, Play, Square, Sparkles } from 'lucide-react';

interface AndroidForegroundNotificationProps {
  isServiceRunning: boolean;
  onToggleService: () => void;
  wakeWordEnabled: boolean;
  onToggleWakeWord: () => void;
  onSimulateWakeWord: () => void;
  onOpenPermissions: () => void;
}

export const AndroidForegroundNotification: React.FC<AndroidForegroundNotificationProps> = ({
  isServiceRunning,
  onToggleService,
  wakeWordEnabled,
  onToggleWakeWord,
  onSimulateWakeWord,
  onOpenPermissions
}) => {
  return (
    <div className="w-full bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl shadow-cyan-950/40 text-white">
      {/* Top Header simulating Android Notification Bar Item */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-md">
            <Mic className="w-3.5 h-3.5 text-black font-bold" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-wide text-slate-200">Sara Voice Service</span>
            <span className="text-[10px] text-slate-500">•</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              Foreground Service
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Battery Whitelisted</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <span>Always-On Listening Engine</span>
            {isServiceRunning && (
              <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {isServiceRunning
              ? wakeWordEnabled
                ? 'Persistent service running with local wake-word trigger ("Sara").'
                : 'Service running. Tap orb to interact.'
              : 'Service paused. Turn on to enable background wake-word activation.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            onClick={onSimulateWakeWord}
            title="Simulate saying 'Sara'"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-medium transition-all active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Say &quot;Sara&quot;</span>
          </button>

          <button
            onClick={onToggleWakeWord}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all active:scale-95 flex items-center gap-1.5 ${
              wakeWordEnabled
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Zap className={`w-3 h-3 ${wakeWordEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>Wake-Word {wakeWordEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={onToggleService}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
              isServiceRunning
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold'
            }`}
          >
            {isServiceRunning ? (
              <>
                <Square className="w-3 h-3 fill-rose-300" />
                <span>Stop Service</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-slate-950" />
                <span>Start Service</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
