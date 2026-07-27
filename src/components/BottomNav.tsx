import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';
import { Home, PlusCircle, Calendar, Inbox, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsCaptureModalOpen, captures, notifications } = useApp();

  const inboxBadges = captures.filter(c => c.status === 'ready_for_review' || c.status === 'needs_clarification' || c.status === 'offline_queued').length;
  const activeNotifsCount = notifications.filter(n => n.active).length;

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'capture', label: 'Capture', icon: PlusCircle },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (id: ActiveTab) => {
    if (id === 'capture') {
      setIsCaptureModalOpen(true);
    } else {
      setActiveTab(id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#E8ECEF] shadow-[0_-4px_20px_-2px_rgba(15,25,37,0.05)] px-3 py-2 max-w-lg mx-auto sm:rounded-t-2xl">
      <div className="flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCapture = item.id === 'capture';

          if (isCapture) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className="flex flex-col items-center justify-center -mt-5"
                aria-label="New Brain Dump Capture"
              >
                <div className="w-14 h-14 rounded-full bg-[#52CBB5] text-white flex items-center justify-center shadow-lg shadow-[#52CBB5]/30 hover:scale-105 active:scale-95 transition-all">
                  <PlusCircle className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium text-[#0F2537] mt-1">Capture</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive ? 'text-[#0F2537] font-semibold' : 'text-[#8A99AD] hover:text-[#0F2537]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {item.id === 'inbox' && inboxBadges > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#FF6B6B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {inboxBadges}
                  </span>
                )}
                {item.id === 'home' && activeNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#52CBB5] w-2.5 h-2.5 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'text-[#0F2537] font-semibold' : 'text-[#8A99AD]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
