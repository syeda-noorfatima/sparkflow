import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Wifi, WifiOff, Sparkles, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { settings, toggleOfflineMode, triggerTestNotification, notifications, setIsOnboardingOpen } = useApp();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const activeNotifsCount = notifications.filter(n => n.active).length;

  return (
    <header className="sticky top-0 z-30 bg-[#F6F8F9]/90 backdrop-blur-md px-4 pt-4 pb-3 max-w-lg mx-auto flex items-center justify-between border-b border-[#E8ECEF]">
      <div>
        <div className="flex items-center gap-1.5 text-[#52CBB5] text-xs font-semibold uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SparkFlow Assistant</span>
        </div>
        <h1 className="text-xl font-bold text-[#0F2537] tracking-tight mt-0.5">
          {getGreeting()}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Offline Mode Toggle Button */}
        <button
          onClick={toggleOfflineMode}
          title={settings.offlineMode ? "Offline Mode Active (Click to go online)" : "Online Mode (Click to test offline capture)"}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
            settings.offlineMode
              ? 'bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30'
              : 'bg-[#F0F4F8] text-[#6B7A90] hover:bg-[#E8ECEF]'
          }`}
        >
          {settings.offlineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#52CBB5]" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {/* Trigger Test Reminder */}
        <button
          onClick={() => triggerTestNotification()}
          className="relative p-2 rounded-full bg-[#FFFFFF] border border-[#E8ECEF] text-[#0F2537] hover:bg-[#F0F4F8] shadow-sm transition-all"
          title="Test Reminder Notification"
        >
          <Bell className="w-4 h-4 text-[#0F2537]" />
          {activeNotifsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF6B6B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeNotifsCount}
            </span>
          )}
        </button>

        {/* Help / Intro Onboarding */}
        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="p-2 rounded-full bg-[#FFFFFF] border border-[#E8ECEF] text-[#8A99AD] hover:text-[#0F2537] hover:bg-[#F0F4F8] shadow-sm transition-all"
          title="Help & Intro Guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
