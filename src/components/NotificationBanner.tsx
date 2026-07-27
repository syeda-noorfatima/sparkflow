import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, Clock, X, Sparkles } from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const { notifications, dismissNotification, snoozeNotification, toggleTaskComplete, toastMessage, setToastMessage } = useApp();
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<string | null>(null);

  const activeNotif = notifications.find(n => n.active);

  const handleComplete = () => {
    if (!activeNotif) return;
    toggleTaskComplete(activeNotif.taskId);
    dismissNotification(activeNotif.id);
  };

  const handleSnooze = (minutes: number) => {
    if (!activeNotif) return;
    snoozeNotification(activeNotif.id, minutes);
    setShowSnoozeMenu(null);
  };

  return (
    <>
      {/* Lightweight Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90%] animate-in slide-in-from-top duration-300">
          <div className="bg-[#0F2537] text-white border border-[#52CBB5]/60 rounded-full px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#52CBB5] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
              </div>
              <p className="text-xs font-bold text-white tracking-wide">
                {toastMessage}
              </p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#8A99AD] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Standard Reminder Notification */}
      {activeNotif && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto animate-in slide-in-from-top duration-300">
      <div className="bg-[#FFFFFF] border-2 border-[#52CBB5] rounded-[24px] p-4 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#52CBB5] text-white flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 fill-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#52CBB5] uppercase tracking-wide">
                SparkFlow Gentle Reminder
              </p>
              <h4 className="text-sm font-bold text-[#0F2537]">
                {activeNotif.taskTitle}
              </h4>
            </div>
          </div>

          <button
            onClick={() => dismissNotification(activeNotif.id)}
            className="text-[#8A99AD] hover:text-[#0F2537] p-1 rounded-full hover:bg-[#F0F4F8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E8ECEF]">
          <button
            onClick={handleComplete}
            className="flex-1 py-2 rounded-full bg-[#52CBB5] text-white text-xs font-bold hover:bg-[#42b5a0] transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Complete</span>
          </button>

          <div className="relative flex-1">
            <button
              onClick={() => setShowSnoozeMenu(showSnoozeMenu ? null : activeNotif.id)}
              className="w-full py-2 rounded-full bg-[#F0F4F8] text-[#0F2537] text-xs font-semibold hover:bg-[#E8ECEF] transition-all flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Snooze</span>
            </button>

            {/* Snooze Options Popup */}
            {showSnoozeMenu === activeNotif.id && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-[#E8ECEF] rounded-[18px] p-2 shadow-xl space-y-1 z-50">
                <p className="text-[10px] font-bold text-[#8A99AD] px-2 py-1 uppercase">Select Snooze Time:</p>
                {[
                  { label: '15 minutes', min: 15 },
                  { label: '30 minutes', min: 30 },
                  { label: '1 hour', min: 60 },
                  { label: '3 hours', min: 180 },
                  { label: 'Tomorrow morning', min: 1440 },
                ].map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSnooze(opt.min)}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-[#0F2537] hover:bg-[#52CBB5]/15 transition-all"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => dismissNotification(activeNotif.id)}
            className="px-3 py-2 rounded-full text-xs font-semibold text-[#8A99AD] hover:bg-[#F0F4F8]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )}
</>
  );
};
