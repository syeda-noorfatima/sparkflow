import React from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { Check, Calendar, Bell, AlertTriangle, ChevronRight } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  showCategory?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, showCategory = false }) => {
  const { toggleTaskComplete, setSelectedTaskId } = useApp();

  const categoryColors: Record<string, string> = {
    School: 'bg-[#D8CEFA]/40 text-[#0F2537]',
    Work: 'bg-[#52CBB5]/20 text-[#0F2537]',
    Personal: 'bg-[#F0F4F8] text-[#6B7A90]',
    Health: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
    Errands: 'bg-amber-100 text-amber-900',
    Finance: 'bg-emerald-100 text-emerald-900',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent trigger when clicking checkbox directly
    if ((e.target as HTMLElement).closest('.checkbox-click-area')) return;
    setSelectedTaskId(task.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-[#FFFFFF] rounded-[20px] p-4 transition-all duration-200 border cursor-pointer group relative shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)] border-[#E8ECEF] hover:border-[#8A99AD]/40 ${
        task.completed ? 'opacity-65 bg-[#F6F8F9]/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Custom Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className={`checkbox-click-area mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-[#8A99AD] hover:border-[#52CBB5] bg-white'
          }`}
          aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-[15px] leading-snug text-[#0F2537] ${
                task.completed ? 'line-through text-[#8A99AD]' : ''
              }`}
            >
              {task.title}
            </h3>
            <ChevronRight className="w-4 h-4 text-[#8A99AD] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </div>

          {/* Notes summary if present */}
          {task.notes && (
            <p className="text-xs text-[#6B7A90] mt-1 line-clamp-2 leading-relaxed">
              {task.notes}
            </p>
          )}

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {/* Category Pill */}
            {showCategory && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                  categoryColors[task.category] || 'bg-[#F0F4F8] text-[#6B7A90]'
                }`}
              >
                {task.category}
              </span>
            )}

            {/* Date Badge */}
            {task.date && task.date !== 'Not Set' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#F0F4F8] text-[#0F2537] font-medium">
                <Calendar className="w-3 h-3 text-[#52CBB5]" />
                <span>{task.date}</span>
              </span>
            )}

            {/* Reminder Time */}
            {task.reminderTime && task.reminderTime !== 'Not Set' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#D8CEFA]/30 text-[#0F2537] font-medium">
                <Bell className="w-3 h-3 text-[#0F2537]" />
                <span>{task.reminderTime}</span>
              </span>
            )}

            {/* Repeat */}
            {task.repeat && task.repeat !== 'Never' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                <span>🔁 {task.repeat}</span>
              </span>
            )}

            {/* Missing Info Warning */}
            {task.missingInfoWarning && !task.completed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-800 font-medium">
                <AlertTriangle className="w-3 h-3" />
                <span>{task.missingInfoWarning}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
