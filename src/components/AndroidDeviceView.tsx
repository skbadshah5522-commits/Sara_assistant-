import React, { useState } from 'react';
import { AssistantState, Contact } from '../types/assistant';
import { INITIAL_CONTACTS, INSTALLED_APPS } from '../services/mockAndroidData';
import {
  Smartphone,
  Phone,
  PhoneCall,
  PhoneOff,
  MessageCircle,
  PlaySquare,
  Mail,
  Calculator as CalcIcon,
  Settings,
  ArrowLeft,
  Home,
  Search,
  Wifi,
  Battery,
  Send,
  Lock,
  Unlock,
  Sparkles,
  Mic,
  Volume2,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';

interface AndroidDeviceViewProps {
  currentApp: string; // 'home' | 'youtube' | 'whatsapp' | 'phone' | 'calculator' | 'gmail' | 'settings' | 'lock'
  onNavigateApp: (appName: string) => void;
  assistantState: AssistantState;
  onOrbClick: () => void;
  transcriptSnippet: string;
  activeCallContact: Contact | null;
  onEndCall: () => void;
  whatsappData: { contact: Contact; message: string } | null;
  gmailData: { recipient: string; subject: string; body: string } | null;
  wakeWordSimulate: () => void;
}

export const AndroidDeviceView: React.FC<AndroidDeviceViewProps> = ({
  currentApp,
  onNavigateApp,
  assistantState,
  onOrbClick,
  transcriptSnippet,
  activeCallContact,
  onEndCall,
  whatsappData,
  gmailData,
  wakeWordSimulate
}) => {
  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  // Active WhatsApp chat contact
  const [activeWaContact, setActiveWaContact] = useState<Contact>(
    whatsappData ? whatsappData.contact : INITIAL_CONTACTS[0]
  );
  const [waMessages, setWaMessages] = useState<Array<{ sender: 'user' | 'contact'; text: string; time: string }>>([
    { sender: 'contact', text: 'Hey! Are you still joining us for dinner later?', time: '11:42 AM' },
    { sender: 'user', text: 'Yes, looking forward to it! What time?', time: '11:44 AM' }
  ]);
  const [waInputText, setWaInputText] = useState('');

  // Update WA messages when whatsappData changes
  React.useEffect(() => {
    if (whatsappData) {
      setActiveWaContact(whatsappData.contact);
      setWaMessages((prev) => [
        ...prev,
        { sender: 'user', text: whatsappData.message, time: 'Just now' }
      ]);
    }
  }, [whatsappData]);

  // Calculator logic
  const handleCalcNum = (num: string) => {
    setCalcDisplay((prev) => (prev === '0' ? num : prev + num));
  };

  const handleCalcOperator = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcDisplay('0');
  };

  const handleCalcEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const current = parseFloat(calcDisplay);
    let result = 0;
    if (calcOp === '+') result = calcPrev + current;
    else if (calcOp === '-') result = calcPrev - current;
    else if (calcOp === '×') result = calcPrev * current;
    else if (calcOp === '÷') result = current !== 0 ? calcPrev / current : 0;
    setCalcDisplay(result.toString());
    setCalcPrev(null);
    setCalcOp(null);
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
  };

  const handleSendWaMessage = () => {
    if (!waInputText.trim()) return;
    setWaMessages((prev) => [
      ...prev,
      { sender: 'user', text: waInputText.trim(), time: 'Just now' }
    ]);
    setWaInputText('');
  };

  return (
    <div className="relative mx-auto w-full max-w-[360px] h-[720px] bg-black rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800 flex flex-col justify-between overflow-hidden select-none">
      {/* Outer Phone Bezel Gloss & Antennas */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Screen Container */}
      <div className="relative w-full h-full bg-slate-950 rounded-[40px] overflow-hidden flex flex-col justify-between border border-slate-800/80">
        {/* Top Status Bar & Punch-Hole Camera */}
        <div className="relative z-30 w-full px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-300">
          <span>09:41</span>

          {/* Dynamic Punch Hole Camera */}
          <div className="w-4 h-4 rounded-full bg-black border border-slate-800 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-700" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-cyan-400">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* MAIN PHONE APP SCREEN VIEWPORT */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col">
          {/* SCREEN: LOCK SCREEN */}
          {currentApp === 'lock' && (
            <div className="w-full h-full flex flex-col items-center justify-between p-6 bg-gradient-to-b from-indigo-950/70 via-slate-950 to-black text-white">
              <div className="text-center mt-12 space-y-1">
                <span className="text-5xl font-extralight tracking-tight">09:41</span>
                <p className="text-xs text-slate-400 font-medium">Wednesday, November 11</p>
              </div>

              {/* Sara Lock Screen Notification */}
              <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 backdrop-blur-md shadow-xl text-left space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-black" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200">Sara Assistant</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">Foreground</span>
                </div>
                <p className="text-xs text-slate-300">
                  Say <span className="font-bold text-pink-300">&ldquo;Sara&rdquo;</span> to awaken your phone hands-free.
                </p>
              </div>

              <div className="w-full flex flex-col items-center gap-3 mb-6">
                <button
                  onClick={() => onNavigateApp('home')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-md border border-white/20 transition-all active:scale-95"
                >
                  <Unlock className="w-4 h-4 text-cyan-400" />
                  <span>Swipe or Tap to Unlock</span>
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: HOME SCREEN */}
          {currentApp === 'home' && (
            <div className="w-full h-full flex flex-col justify-between p-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black text-white">
              {/* Home Clock & Search Widget */}
              <div className="space-y-4 pt-2">
                <div className="text-center">
                  <h2 className="text-4xl font-extralight text-slate-100 tracking-tight">09:41</h2>
                  <p className="text-[11px] text-cyan-400 font-medium">Wed, Nov 11 • Sunny 72°F</p>
                </div>

                {/* Google / Sara Search Bar */}
                <div
                  onClick={() => onNavigateApp('youtube')}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-700 transition-colors shadow-md"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Search or ask Sara...</span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      wakeWordSimulate();
                    }}
                    className="p-1.5 rounded-full bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Apps Grid */}
              <div className="grid grid-cols-4 gap-4 py-6">
                {/* YouTube */}
                <button
                  onClick={() => onNavigateApp('youtube')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
                    <PlaySquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">YouTube</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => onNavigateApp('whatsapp')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">WhatsApp</span>
                </button>

                {/* Phone / Contacts */}
                <button
                  onClick={() => onNavigateApp('phone')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition-transform">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">Phone</span>
                </button>

                {/* Calculator */}
                <button
                  onClick={() => onNavigateApp('calculator')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-900/40 group-hover:scale-105 transition-transform">
                    <CalcIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">Calculator</span>
                </button>

                {/* Gmail */}
                <button
                  onClick={() => onNavigateApp('gmail')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition-transform">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">Gmail</span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => onNavigateApp('settings')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-900/40 group-hover:scale-105 transition-transform">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">Settings</span>
                </button>

                {/* Lock Device */}
                <button
                  onClick={() => onNavigateApp('lock')}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform">
                    <Lock className="w-6 h-6 text-purple-200" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">Lock</span>
                </button>
              </div>

              {/* Bottom Dock Bar */}
              <div className="w-full p-2.5 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-around backdrop-blur-md">
                <button onClick={() => onNavigateApp('phone')} className="p-2 text-cyan-400">
                  <Phone className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigateApp('whatsapp')} className="p-2 text-emerald-400">
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigateApp('youtube')} className="p-2 text-rose-400">
                  <PlaySquare className="w-5 h-5" />
                </button>
                <button onClick={() => onNavigateApp('settings')} className="p-2 text-slate-400">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: YOUTUBE APP */}
          {currentApp === 'youtube' && (
            <div className="w-full h-full flex flex-col bg-slate-950 text-white">
              {/* Header */}
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => onNavigateApp('home')} className="p-1 hover:text-cyan-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <PlaySquare className="w-5 h-5 text-red-500 fill-red-500" />
                    <span className="font-bold text-sm tracking-tighter">YouTube</span>
                  </div>
                </div>
                <Search className="w-4 h-4 text-slate-400" />
              </div>

              {/* Featured Video Player */}
              <div className="w-full aspect-video bg-black relative flex items-center justify-center group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl z-20 group-hover:scale-110 transition-transform">
                  <PlaySquare className="w-6 h-6 fill-white" />
                </div>
                <span className="absolute bottom-2 left-3 z-20 text-xs font-semibold text-white">
                  Google Gemini Live API • Architecture Deep Dive
                </span>
              </div>

              {/* Video List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white leading-tight">
                    Building Real-Time Voice Assistants with Gemini Live 24kHz Audio
                  </h4>
                  <p className="text-[10px] text-slate-400">Android Developers • 142K views • 2 days ago</p>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex gap-2">
                  <div className="w-20 h-14 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center">
                    <PlaySquare className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold line-clamp-2">
                      Jetpack Compose Canvas: Futuristic State-Driven Audio Orbs
                    </p>
                    <span className="text-[10px] text-slate-500">Android Studio Ladybug</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: WHATSAPP APP */}
          {currentApp === 'whatsapp' && (
            <div className="w-full h-full flex flex-col bg-[#0b141a] text-white">
              {/* WhatsApp App Header */}
              <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-[#222e35]">
                <div className="flex items-center gap-2">
                  <button onClick={() => onNavigateApp('home')} className="p-1 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div
                    className={`w-7 h-7 rounded-full bg-gradient-to-tr ${activeWaContact.avatarColor} flex items-center justify-center text-xs font-bold`}
                  >
                    {activeWaContact.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white leading-none">{activeWaContact.name}</h4>
                    <span className="text-[9px] text-[#8696a0]">online</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigateApp('phone')}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 flex flex-col justify-end">
                <span className="self-center text-[9px] px-2 py-0.5 rounded bg-[#182229] text-[#8696a0] font-mono">
                  Today
                </span>
                {waMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs ${
                      msg.sender === 'user'
                        ? 'self-end bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                        : 'self-start bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="text-[8px] text-[#8696a0] block text-right mt-0.5">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* WhatsApp Input */}
              <div className="p-2 bg-[#202c33] flex items-center gap-2">
                <input
                  type="text"
                  value={waInputText}
                  onChange={(e) => setWaInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendWaMessage()}
                  placeholder="Message..."
                  className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 text-xs text-white placeholder-[#8696a0] outline-none"
                />
                <button
                  onClick={handleSendWaMessage}
                  className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-500"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: PHONE & CONTACTS APP */}
          {currentApp === 'phone' && (
            <div className="w-full h-full flex flex-col bg-slate-950 text-white">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => onNavigateApp('home')} className="p-1 hover:text-cyan-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold">Contacts &amp; Phone</span>
                </div>
                <Phone className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Contacts List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-1">
                  Speed Dial Contacts
                </span>
                {INITIAL_CONTACTS.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-tr ${c.avatarColor} flex items-center justify-center text-xs font-bold`}
                      >
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{c.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onNavigateApp('whatsapp');
                          setActiveWaContact(c);
                        }}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 text-emerald-400"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Trigger simulated phone call
                          onNavigateApp('phone');
                        }}
                        className="p-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-md"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN: CALCULATOR APP */}
          {currentApp === 'calculator' && (
            <div className="w-full h-full flex flex-col justify-between p-4 bg-black text-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <button onClick={() => onNavigateApp('home')} className="p-1 hover:text-cyan-400">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-400">Calculator</span>
                <span className="w-4" />
              </div>

              {/* Display */}
              <div className="py-6 text-right pr-2">
                <span className="text-3xl font-mono text-cyan-400 font-light truncate block">
                  {calcDisplay}
                </span>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-4 gap-2.5 pb-2">
                {['C', '±', '%', '÷'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => (btn === 'C' ? handleCalcClear() : handleCalcOperator(btn))}
                    className="h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-sm"
                  >
                    {btn}
                  </button>
                ))}
                {['7', '8', '9', '×'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => (btn === '×' ? handleCalcOperator(btn) : handleCalcNum(btn))}
                    className={`h-12 rounded-2xl font-bold text-sm ${
                      btn === '×' ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
                {['4', '5', '6', '-'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => (btn === '-' ? handleCalcOperator(btn) : handleCalcNum(btn))}
                    className={`h-12 rounded-2xl font-bold text-sm ${
                      btn === '-' ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
                {['1', '2', '3', '+'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => (btn === '+' ? handleCalcOperator(btn) : handleCalcNum(btn))}
                    className={`h-12 rounded-2xl font-bold text-sm ${
                      btn === '+' ? 'bg-slate-800 text-amber-400' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
                <button
                  onClick={() => handleCalcNum('0')}
                  className="col-span-2 h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm"
                >
                  0
                </button>
                <button
                  onClick={() => handleCalcNum('.')}
                  className="h-12 rounded-2xl bg-slate-900 text-white font-bold text-sm"
                >
                  .
                </button>
                <button
                  onClick={handleCalcEquals}
                  className="h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow-md"
                >
                  =
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: GMAIL APP */}
          {currentApp === 'gmail' && (
            <div className="w-full h-full flex flex-col bg-slate-950 text-white">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={() => onNavigateApp('home')} className="p-1 hover:text-cyan-400">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" /> Gmail
                  </span>
                </div>
                <Search className="w-4 h-4 text-slate-400" />
              </div>

              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-1">
                  Primary Inbox
                </span>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Sarah Chen</span>
                    <span className="text-[9px] text-slate-500">10:15 AM</span>
                  </div>
                  <p className="text-xs text-cyan-300 font-medium">Q4 Project Architecture Review</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    Hey! Looking forward to reviewing the new Gemini Live bi-directional integration...
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Google Cloud Team</span>
                    <span className="text-[9px] text-slate-500">Yesterday</span>
                  </div>
                  <p className="text-xs text-white font-medium">Your Cloud Run deployment is live</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    Sara voice engine deployed on port 3000 with WebSocket support...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: SETTINGS */}
          {currentApp === 'settings' && (
            <div className="w-full h-full flex flex-col bg-slate-950 text-white p-3 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <button onClick={() => onNavigateApp('home')} className="p-1 hover:text-cyan-400">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold">Android System Settings</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-white">Default Voice Assistant</span>
                <p className="text-[11px] text-cyan-400 font-medium">Sara Voice Assistant (Active)</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-white">Battery Optimization</span>
                <p className="text-[11px] text-emerald-400 font-medium">Exempt / Whitelisted (Foreground Service)</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs font-semibold text-white">Wake Word Engine</span>
                <p className="text-[11px] text-pink-300 font-medium">&ldquo;Sara&rdquo; Local Detection Active</p>
              </div>
            </div>
          )}
        </div>

        {/* FLOATING SARA VOICE OVERLAY (Runs smoothly on top of any active app!) */}
        <div className="relative z-40 px-4 pb-2 pt-1 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent flex flex-col items-center">
          {transcriptSnippet && (
            <div className="mb-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-pink-500/40 text-[10px] text-pink-200 font-medium shadow-lg max-w-[280px] truncate text-center">
              &ldquo;{transcriptSnippet}&rdquo;
            </div>
          )}

          {/* Sara Floating Pill Button */}
          <div
            onClick={onOrbClick}
            className={`w-full py-2.5 px-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-xl ${
              assistantState === 'speaking'
                ? 'bg-pink-950/70 border-pink-500 text-pink-200'
                : assistantState === 'listening'
                ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                : assistantState === 'thinking'
                ? 'bg-purple-950/70 border-purple-500 text-purple-200'
                : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center">
                <Mic className="w-3.5 h-3.5 text-black" />
              </div>
              <div className="text-left">
                <span className="text-xs font-bold block leading-none">Sara Assistant</span>
                <span className="text-[9px] uppercase font-mono tracking-wider opacity-80">
                  {assistantState === 'speaking'
                    ? 'Speaking • Tap to Barge-in'
                    : assistantState === 'listening'
                    ? 'Listening...'
                    : assistantState === 'thinking'
                    ? 'Thinking...'
                    : 'Tap or Say "Sara"'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* BOTTOM ANDROID GESTURE PILL BAR */}
        <div className="w-full pb-2 pt-1 flex justify-center bg-slate-950">
          <div
            onClick={() => onNavigateApp('home')}
            className="w-28 h-1 bg-slate-600 rounded-full hover:bg-slate-400 cursor-pointer transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
