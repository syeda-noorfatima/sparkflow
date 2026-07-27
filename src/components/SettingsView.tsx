import React from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Bell, Moon, Sun, WifiOff, Volume2, RotateCcw, Shield, Sparkles } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, toggleOfflineMode, clearAllData } = useApp();
  const [geminiStatus, setGeminiStatus] = React.useState<{ connected: boolean; model?: string; message?: string } | null>(null);

  React.useEffect(() => {
    fetch('/api/gemini/status')
      .then(r => r.json())
      .then(d => setGeminiStatus(d))
      .catch(() => setGeminiStatus({ connected: false, message: 'Server endpoint unreachable' }));
  }, []);

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-3">
      <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#52CBB5]" />
          <div>
            <h2 className="text-base font-bold text-[#0F2537]">Preferences & Settings</h2>
            <p className="text-[11px] text-[#8A99AD]">Customize executive functioning parameters</p>
          </div>
        </div>
      </div>

      {/* Gemini AI Status Card */}
      <section className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 space-y-2.5 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
        <h3 className="text-xs font-bold text-[#0F2537] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D8CEFA]" />
          <span>Gemini AI Engine Status</span>
        </h3>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">
              {geminiStatus?.connected ? 'Gemini 3.6 Flash Active' : 'Fallback Engine (API Key Pending)'}
            </p>
            <p className="text-[11px] text-[#8A99AD]">
              {geminiStatus?.connected
                ? 'Server connected via GEMINI_API_KEY environment variable.'
                : 'API key is configured via system environment settings.'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            geminiStatus?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {geminiStatus?.connected ? '● Connected' : '○ Standby'}
          </span>
        </div>
      </section>

      {/* Reminder Defaults Section */}
      <section className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
        <h3 className="text-xs font-bold text-[#0F2537] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#52CBB5]" />
          <span>Reminders & Brain Dump Prompts</span>
        </h3>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">Default Task Reminder Time</p>
            <p className="text-[11px] text-[#8A99AD]">Time assigned when AI creates a reminder</p>
          </div>
          <input
            type="time"
            value={settings.defaultReminderTime}
            onChange={(e) => updateSettings({ defaultReminderTime: e.target.value })}
            className="bg-[#F6F8F9] border border-[#E8ECEF] rounded-[10px] px-2.5 py-1 text-xs font-bold text-[#0F2537]"
          />
        </div>

        <div className="border-t border-[#E8ECEF] pt-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">Evening Brain Dump Reminder</p>
            <p className="text-[11px] text-[#8A99AD]">Daily prompt to capture thoughts before bed</p>
          </div>
          <input
            type="checkbox"
            checked={settings.brainDumpEnabled}
            onChange={(e) => updateSettings({ brainDumpEnabled: e.target.checked })}
            className="w-4 h-4 accent-[#52CBB5] rounded cursor-pointer"
          />
        </div>

        {settings.brainDumpEnabled && (
          <div className="flex items-center justify-between pl-4 border-l-2 border-[#52CBB5]">
            <p className="text-xs text-[#6B7A90]">Brain Dump Schedule</p>
            <input
              type="time"
              value={settings.brainDumpReminderTime}
              onChange={(e) => updateSettings({ brainDumpReminderTime: e.target.value })}
              className="bg-[#F6F8F9] border border-[#E8ECEF] rounded-[10px] px-2.5 py-1 text-xs font-bold text-[#0F2537]"
            />
          </div>
        )}
      </section>

      {/* Interface Theme & Sounds */}
      <section className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
        <h3 className="text-xs font-bold text-[#0F2537] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D8CEFA]" />
          <span>Appearance & Environment</span>
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">Calm Dark Mode Palette</p>
            <p className="text-[11px] text-[#8A99AD]">Soft eye-safe contrast for night planning</p>
          </div>
          <button
            onClick={() => updateSettings({ theme: settings.theme === 'light' ? 'calm_dark' : 'light' })}
            className={`p-2 rounded-full border transition-all ${
              settings.theme === 'calm_dark' ? 'bg-[#0F2537] text-white border-[#0F2537]' : 'bg-[#F0F4F8] text-[#0F2537] border-[#E8ECEF]'
            }`}
          >
            {settings.theme === 'calm_dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>
        </div>

        <div className="border-t border-[#E8ECEF] pt-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">Simulate Offline Capture Mode</p>
            <p className="text-[11px] text-[#8A99AD]">Test capture queue when internet is disconnected</p>
          </div>
          <button
            onClick={toggleOfflineMode}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              settings.offlineMode ? 'bg-[#FF6B6B] text-white' : 'bg-[#F0F4F8] text-[#6B7A90]'
            }`}
          >
            {settings.offlineMode ? 'Offline ON' : 'Online'}
          </button>
        </div>
      </section>

      {/* Developer & Data Controls */}
      <section className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 space-y-3.5 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
        <h3 className="text-xs font-bold text-[#0F2537] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#8A99AD]" />
          <span>Data & State Management</span>
        </h3>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs font-semibold text-[#0F2537]">Clear All Workspace Data</p>
            <p className="text-[11px] text-[#8A99AD]">Empties all tasks and captures cleanly</p>
          </div>
          <button
            onClick={clearAllData}
            className="px-3.5 py-1.5 rounded-full bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </section>

      <div className="text-center text-[11px] text-[#8A99AD] pt-2">
        SparkFlow v1.0.0 • AI-Powered Executive Assistant
      </div>
    </div>
  );
};
