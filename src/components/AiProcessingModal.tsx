import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Task, PriorityType, CategoryType } from '../types';
import { Sparkles, Check, AlertCircle, Calendar, Bell, Trash2, Edit2, ArrowRight } from 'lucide-react';

export const AiProcessingModal: React.FC = () => {
  const {
    isProcessingAi,
    processingStep,
    clarificationCapture,
    answerClarification,
    reviewCapture,
    saveReviewedTasks,
  } = useApp();

  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [editableTasks, setEditableTasks] = useState<Omit<Task, 'id' | 'createdAt'>[]>([]);

  // Initialize editable tasks when review capture becomes active
  React.useEffect(() => {
    if (reviewCapture && reviewCapture.extractedTasks) {
      setEditableTasks(reviewCapture.extractedTasks as Omit<Task, 'id' | 'createdAt'>[]);
    }
  }, [reviewCapture]);

  if (!isProcessingAi && !clarificationCapture && !reviewCapture) return null;

  // 1. AI PROCESSING ANIMATION SCREEN (Flow 4)
  if (isProcessingAi) {
    const steps = [
      "Finding tasks",
      "Parsing scheduled dates",
      "Prioritizing work",
      "Creating reminders",
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2537]/50 backdrop-blur-xs p-4 animate-in fade-in">
        <div className="bg-[#FFFFFF] w-full max-w-sm rounded-[24px] p-6 shadow-2xl border border-[#E8ECEF] text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#D8CEFA] text-[#0F2537] mx-auto flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#0F2537]">Organizing your thoughts...</h2>
            <p className="text-xs text-[#8A99AD] mt-1">
              SparkFlow is converting raw input into structured tasks.
            </p>
          </div>

          <div className="space-y-2.5 text-left bg-[#F6F8F9] p-4 rounded-[16px]">
            {steps.map((label, idx) => {
              const stepNum = idx + 1;
              const isDone = processingStep > stepNum;
              const isCurrent = processingStep === stepNum;

              return (
                <div key={idx} className="flex items-center gap-3 text-xs font-medium">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isDone
                        ? 'bg-[#52CBB5] text-white'
                        : isCurrent
                        ? 'bg-[#D8CEFA] text-[#0F2537] animate-bounce'
                        : 'bg-[#E8ECEF] text-[#8A99AD]'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : stepNum}
                  </div>
                  <span className={isDone ? 'text-[#0F2537] font-semibold' : isCurrent ? 'text-[#0F2537]' : 'text-[#8A99AD]'}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. AI REVIEW SCREEN (Flow 6)
  if (reviewCapture) {
    const handleUpdateTaskField = (idx: number, field: string, value: any) => {
      setEditableTasks(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [field]: value };
        return copy;
      });
    };

    const handleDeleteFromReview = (idx: number) => {
      setEditableTasks(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
      if (editableTasks.length === 0) return;
      saveReviewedTasks(reviewCapture.id, editableTasks);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F2537]/50 backdrop-blur-xs p-4 animate-in fade-in overflow-y-auto">
        <div className="bg-[#FFFFFF] w-full max-w-lg rounded-[28px] p-5 shadow-2xl border border-[#E8ECEF] space-y-4 my-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#E8ECEF] pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-[#52CBB5] text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>AI Organization Review</span>
              </div>
              <h2 className="text-lg font-bold text-[#0F2537] mt-0.5">Review Extracted Tasks</h2>
            </div>
            <span className="bg-[#52CBB5]/20 text-[#0F2537] text-xs font-bold px-2.5 py-1 rounded-full">
              {editableTasks.length} task{editableTasks.length > 1 ? 's' : ''} extracted
            </span>
          </div>

          {/* List of Extracted Tasks for user review */}
          <div className="space-y-3">
            {editableTasks.map((t, idx) => (
              <div
                key={idx}
                className="bg-[#F6F8F9] border border-[#E8ECEF] rounded-[20px] p-4 space-y-2.5 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    value={t.title}
                    onChange={(e) => handleUpdateTaskField(idx, 'title', e.target.value)}
                    className="w-full bg-white border border-[#E8ECEF] rounded-[10px] px-3 py-1.5 text-xs font-bold text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
                  />
                  <button
                    onClick={() => handleDeleteFromReview(idx)}
                    className="p-1 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-lg transition-all"
                    title="Remove task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#8A99AD] block mb-0.5">Priority</label>
                    <select
                      value={t.priority}
                      onChange={(e) => handleUpdateTaskField(idx, 'priority', e.target.value as PriorityType)}
                      className="w-full bg-white border border-[#E8ECEF] rounded-[10px] px-2 py-1 text-xs font-medium text-[#0F2537]"
                    >
                      <option value="must">Must Do (Urgent)</option>
                      <option value="could">Could Do (Low pressure)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#8A99AD] block mb-0.5">Category</label>
                    <select
                      value={t.category}
                      onChange={(e) => handleUpdateTaskField(idx, 'category', e.target.value as CategoryType)}
                      className="w-full bg-white border border-[#E8ECEF] rounded-[10px] px-2 py-1 text-xs font-medium text-[#0F2537]"
                    >
                      <option value="School">School</option>
                      <option value="Work">Work</option>
                      <option value="Personal">Personal</option>
                      <option value="Health">Health</option>
                      <option value="Errands">Errands</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-[#8A99AD] block mb-0.5">Date</label>
                    <input
                      type="text"
                      placeholder="e.g. Thursday, Today"
                      value={t.date || ''}
                      onChange={(e) => handleUpdateTaskField(idx, 'date', e.target.value)}
                      className="w-full bg-white border border-[#E8ECEF] rounded-[10px] px-2 py-1 text-xs font-medium text-[#0F2537]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#8A99AD] block mb-0.5">Reminder Time</label>
                    <input
                      type="time"
                      value={t.reminderTime || '09:00'}
                      onChange={(e) => handleUpdateTaskField(idx, 'reminderTime', e.target.value)}
                      className="w-full bg-white border border-[#E8ECEF] rounded-[10px] px-2 py-1 text-xs font-medium text-[#0F2537]"
                    />
                  </div>
                </div>

                {t.missingInfoWarning && (
                  <p className="text-[11px] text-amber-700 bg-amber-100/60 p-2 rounded-lg font-medium">
                    ⚠️ {t.missingInfoWarning}. You can set a date above or save as is.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8ECEF]">
            <button
              onClick={handleSave}
              className="w-full py-3 bg-[#52CBB5] text-white font-bold text-xs rounded-full shadow-md shadow-[#52CBB5]/20 hover:bg-[#42b5a0] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save {editableTasks.length} Task{editableTasks.length > 1 ? 's' : ''} to SparkFlow</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
