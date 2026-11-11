import React from 'react';
import { PermissionsState } from '../types/assistant';
import { Mic, Users, PhoneCall, Bell, Shield, Check, X, Sparkles, AlertCircle } from 'lucide-react';

interface PermissionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: PermissionsState;
  onTogglePermission: (key: keyof PermissionsState) => void;
  onGrantAll: () => void;
}

export const PermissionsSheet: React.FC<PermissionsSheetProps> = ({
  isOpen,
  onClose,
  permissions,
  onTogglePermission,
  onGrantAll
}) => {
  if (!isOpen) return null;

  const permissionItems = [
    {
      key: 'recordAudio' as keyof PermissionsState,
      label: 'Record Audio',
      manifest: 'android.permission.RECORD_AUDIO',
      description: 'Required for real-time 16kHz PCM streaming and local "Sara" wake-word detection.',
      icon: <Mic className="w-5 h-5 text-cyan-400" />,
      granted: permissions.recordAudio
    },
    {
      key: 'readContacts' as keyof PermissionsState,
      label: 'Read Contacts',
      manifest: 'android.permission.READ_CONTACTS',
      description: 'Used by Sara to resolve names for WhatsApp messages and phone calls.',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      granted: permissions.readContacts
    },
    {
      key: 'callPhone' as keyof PermissionsState,
      label: 'Call Phone',
      manifest: 'android.permission.CALL_PHONE',
      description: 'Allows Sara to trigger native ACTION_CALL intents to phone numbers.',
      icon: <PhoneCall className="w-5 h-5 text-emerald-400" />,
      granted: permissions.callPhone
    },
    {
      key: 'postNotifications' as keyof PermissionsState,
      label: 'Post Notifications',
      manifest: 'android.permission.POST_NOTIFICATIONS',
      description: 'Keeps the persistent Foreground Service active in the notification shade.',
      icon: <Bell className="w-5 h-5 text-pink-400" />,
      granted: permissions.postNotifications
    }
  ];

  const allGranted = Object.values(permissions).every(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Permissions Onboarding</h3>
            <p className="text-xs text-slate-400">Android 14+ Runtime Security &amp; Guardrails</p>
          </div>
        </div>

        {/* Sassy Guardrail Alert */}
        <div className="mt-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-200 leading-relaxed">
            <span className="font-semibold text-pink-300">Sara&apos;s Guardrail Note:</span> If any permission is revoked,
            Sara will playfully tease you and instruct you to toggle it here before executing intents!
          </p>
        </div>

        {/* Permissions List */}
        <div className="mt-5 space-y-3">
          {permissionItems.map((item) => (
            <div
              key={item.key}
              className={`p-3.5 rounded-2xl border transition-all ${
                item.granted
                  ? 'bg-slate-800/60 border-slate-700'
                  : 'bg-rose-950/20 border-rose-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {item.manifest.split('.').pop()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.description}</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => onTogglePermission(item.key)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors relative shrink-0 ${
                    item.granted ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform flex items-center justify-center ${
                      item.granted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {item.granted ? (
                      <Check className="w-3 h-3 text-cyan-600 stroke-[3]" />
                    ) : (
                      <X className="w-3 h-3 text-slate-400 stroke-[3]" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onGrantAll}
            disabled={allGranted}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              allGranted
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/25'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{allGranted ? 'All Permissions Granted' : 'Grant All Permissions'}</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
