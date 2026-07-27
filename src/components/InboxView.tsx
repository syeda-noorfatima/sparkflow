import React from 'react';
import { useApp } from '../context/AppContext';
import { Inbox as InboxIcon, RefreshCw, AlertCircle, Sparkles, CheckCircle2, Clock, Mic, WifiOff, FileText } from 'lucide-react';

export const InboxView: React.FC = () => {
  const { captures, setActiveCapture, settings, toggleOfflineMode, setIsCaptureModalOpen } = useApp();

  const activeCaptures = captures.filter(c => c.status !== 'completed');
  const archivedCaptures = captures.filter(c => c.status === 'completed');

  const statusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 bg-[#D8CEFA] text-[#0F2537] text-[10px] font-bold px-2.5 py-0.5 rounded-full animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>AI Processing</span>
          </span>
        );
      case 'ready_for_review':
        return (
          <span className="inline-flex items-center gap-1 bg-[#52CBB5]/20 text-[#0F2537] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-[#52CBB5]" />
            <span>Ready for Review</span>
          </span>
        );
      case 'emotional_non_task':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            <span>No Actionable Task</span>
          </span>
        );
      case 'error_saved':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span>Saved (Will Retry)</span>
          </span>
        );
      case 'offline_queued':
        return (
          <span className="inline-flex items-center gap-1 bg-[#FF6B6B]/15 text-[#FF6B6B] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            <WifiOff className="w-3 h-3" />
            <span>Queued (Offline)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-[#F0F4F8] text-[#6B7A90] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            <span>Processed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-3">
      {/* Header */}
      <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <InboxIcon className="w-5 h-5 text-[#52CBB5]" />
          <div>
            <h2 className="text-base font-bold text-[#0F2537]">Capture Inbox</h2>
            <p className="text-[11px] text-[#8A99AD]">Raw brain dumps awaiting AI extraction</p>
          </div>
        </div>

        <button
          onClick={() => setIsCaptureModalOpen(true)}
          className="px-3 py-1.5 rounded-full bg-[#52CBB5] text-white text-xs font-semibold hover:bg-[#42b5a0] transition-all"
        >
          + Capture
        </button>
      </div>

      {/* Offline sync banner if active */}
      {settings.offlineMode && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 rounded-[18px] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#FF6B6B] font-medium">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>You are testing Offline Mode. Captures will process when reconnected.</span>
          </div>
          <button
            onClick={toggleOfflineMode}
            className="text-xs font-bold text-[#FF6B6B] underline shrink-0 ml-2"
          >
            Go Online
          </button>
        </div>
      )}

      {/* Active Captures List */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-[#8A99AD] uppercase tracking-wide">
          Active Captures ({activeCaptures.length})
        </h3>

        {activeCaptures.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-8 text-center space-y-3 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
            <InboxIcon className="w-10 h-10 text-[#52CBB5] mx-auto opacity-80" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-[#0F2537]">Your Inbox is clear.</p>
              <p className="text-xs text-[#8A99AD] max-w-xs mx-auto">
                Capture thoughts anytime and SparkFlow will extract actionable tasks automatically.
              </p>
            </div>
            <button
              onClick={() => setIsCaptureModalOpen(true)}
              className="px-4 py-2 bg-[#52CBB5] hover:bg-[#42b5a0] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>Capture Thought</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCaptures.map(cap => (
              <div
                key={cap.id}
                className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 space-y-3 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7A90]">
                    {cap.type === 'voice' ? (
                      <Mic className="w-3.5 h-3.5 text-[#FF6B6B]" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-[#52CBB5]" />
                    )}
                    <span>{cap.type === 'voice' ? `Voice (${cap.audioDurationSeconds || 5}s)` : 'Text Dump'}</span>
                  </div>
                  {statusBadge(cap.status)}
                </div>

                <p className="text-xs text-[#0F2537] bg-[#F6F8F9] p-3 rounded-[14px] italic leading-relaxed font-mono">
                  "{cap.rawText}"
                </p>

                {cap.status === 'ready_for_review' && (
                  <button
                    onClick={() => setActiveCapture(cap)}
                    className="w-full py-2 bg-[#52CBB5] text-white font-bold text-xs rounded-full hover:bg-[#42b5a0] transition-all shadow-sm"
                  >
                    Review Extracted Tasks
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History / Processed Captures */}
      {archivedCaptures.length > 0 && (
        <section className="space-y-2 pt-3">
          <h3 className="text-xs font-bold text-[#8A99AD] uppercase tracking-wide">
            Processed History ({archivedCaptures.length})
          </h3>
          <div className="space-y-2">
            {archivedCaptures.map(cap => (
              <div key={cap.id} className="bg-[#FFFFFF]/70 border border-[#E8ECEF] rounded-[16px] p-3 flex items-center justify-between text-xs text-[#6B7A90]">
                <span className="truncate max-w-[240px]">"{cap.rawText}"</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Saved
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
