import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../android-source/androidProjectFiles';
import { Download, Copy, Check, FileCode, Folder, Terminal, Sparkles, ChevronRight, Layers } from 'lucide-react';
import JSZip from 'jszip';

interface AndroidProjectExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectExplorer: React.FC<AndroidProjectExplorerProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Add each Android file into the zip
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add basic README and root build files
      zip.file(
        'README.md',
        `# Sara - Native Android Voice Assistant
Real-time bi-directional audio streaming assistant powered by Gemini Live API, local wake-word detection, foreground service, and Jetpack Compose.

## Getting Started
1. Open this project folder in Android Studio Ladybug or Meerkat.
2. Ensure you have Android SDK 35 installed.
3. Configure your \`GEMINI_API_KEY\` in your local properties or environment.
4. Run on a physical Android device or emulator with microphone enabled.

## Architecture
- **UI Layer**: Jetpack Compose Canvas orb visualizer (\`SaraOrbCanvas.kt\`)
- **Service Layer**: Foreground Service (\`SaraForegroundService.kt\`) with persistent notification & wake-lock
- **Audio Engine**: 16kHz PCM capture + 24kHz AudioTrack playback (\`LiveSessionManager.kt\`)
- **Wake Word**: Local AudioRecord sibilant/energy detector (\`WakeWordDetector.kt\`)
- **Tool Dispatcher**: Android Intents for Calls, WhatsApp, Gmail, Apps (\`ToolExecutionEngine.kt\`)
`
      );

      zip.file(
        'build.gradle.kts',
        `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.compose.compiler) apply false
}
`
      );

      zip.file(
        'settings.gradle.kts',
        `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "SaraAssistant"
include(":app")
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sara-native-android-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create zip', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Android Studio Project Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Kotlin + Compose
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Production-grade Android architecture for Sara Voice Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadZip}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating ZIP...' : 'Download Project (.zip)'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        {/* Studio Body: File Tree + Code Editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-full md:w-80 bg-slate-950/60 border-r border-slate-800 p-4 overflow-y-auto space-y-4 shrink-0">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold block mb-2 px-2">
                Project Files
              </span>
              <div className="space-y-1">
                {ANDROID_PROJECT_FILES.map((file) => {
                  const isSelected = selectedFile.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <div className="truncate">
                        <span className="block truncate">{file.filename}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{file.path}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Architecture Highlights Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Clean MVVM Architecture</span>
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1 pl-4 list-disc">
                <li>Thread-safe 16kHz PCM streaming</li>
                <li>Foreground Service with WakeLock</li>
                <li>Local AudioRecord &quot;Sara&quot; wake word</li>
                <li>Zero-touch voice interruption</li>
                <li>Native Intent Dispatch Engine</li>
              </ul>
            </div>
          </div>

          {/* Main Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden">
            {/* File Info Bar */}
            <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400">{selectedFile.filename}</span>
                <p className="text-[11px] text-slate-400">{selectedFile.description}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Content */}
            <div className="flex-1 p-5 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#0a0f1d] select-text">
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
