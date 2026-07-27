import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskCard } from './TaskCard';
import { Sparkles, ChevronDown, ChevronUp, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

export const HomeView: React.FC = () => {
  const { tasks, setSelectedTaskId, setIsCaptureModalOpen } = useApp();
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  const activeTasks = tasks.filter(t => !t.completed);
  const mustDoTasks = activeTasks.filter(t => t.priority === 'must');
  const couldDoTasks = activeTasks.filter(t => t.priority === 'could');
  const completedTasks = tasks.filter(t => t.completed);

  // Select the next priority task: first Must Do task, or first Could Do task if no Must Do tasks exist
  const nextPriorityTask = mustDoTasks.length > 0 ? mustDoTasks[0] : couldDoTasks[0];

  const getDateReminderLine = (t: typeof nextPriorityTask) => {
    if (!t) return '';
    const parts: string[] = [];
    if (t.date && t.date !== 'Not Set') {
      parts.push(t.date);
    }
    if (t.reminderTime && t.reminderTime !== 'Not Set') {
      parts.push(`Due at ${t.reminderTime}`);
    }
    return parts.join(' • ');
  };

  const dateReminderLine = nextPriorityTask ? getDateReminderLine(nextPriorityTask) : '';

  return (
    <div className="space-y-5 pb-24 max-w-lg mx-auto px-4 pt-3">
      {/* Empty State when no tasks exist */}
      {tasks.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[24px] p-8 text-center shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)] space-y-5 my-4">
          <div className="w-16 h-16 bg-[#D8CEFA]/30 rounded-full flex items-center justify-center mx-auto text-[#0F2537]">
            <Sparkles className="w-8 h-8 text-[#52CBB5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F2537] tracking-tight">Nothing to organize yet.</h2>
            <p className="text-xs text-[#6B7A90] leading-relaxed max-w-xs mx-auto">
              Capture your first thought and SparkFlow will organize it for you.
            </p>
          </div>
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="w-full py-3.5 bg-[#52CBB5] hover:bg-[#42b5a0] text-white font-bold text-sm rounded-full shadow-md shadow-[#52CBB5]/20 flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Capture First Thought</span>
          </button>
        </div>
      ) : (
        <>
          {/* Next Priority Card */}
          {nextPriorityTask && (
            <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-5 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.06)] space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#52CBB5]" />
                  <span className="text-[11px] font-bold text-[#0F2537] uppercase tracking-wider">
                    Next Priority
                  </span>
                </div>
                {nextPriorityTask.priority === 'must' ? (
                  <span className="bg-[#0F2537] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Must Do
                  </span>
                ) : (
                  <span className="bg-[#F0F4F8] text-[#6B7A90] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Could Do
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0F2537] tracking-tight leading-snug">
                  {nextPriorityTask.title}
                </h3>
                {dateReminderLine && (
                  <p className="text-xs font-semibold text-[#52CBB5]">
                    {dateReminderLine}
                  </p>
                )}
              </div>

              <button
                onClick={() => setSelectedTaskId(nextPriorityTask.id)}
                className="w-full py-2.5 bg-[#0F2537] hover:bg-[#1A364D] text-white text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99]"
              >
                <span>Open Task</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Must Do Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#0F2537] tracking-tight">
                  Must Do
                </h2>
                <span className="bg-[#0F2537] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {mustDoTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsCaptureModalOpen(true)}
                className="text-xs font-semibold text-[#52CBB5] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {mustDoTasks.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-dashed border-[#E8ECEF] rounded-[20px] p-6 text-center text-[#6B7A90]">
                <CheckCircle2 className="w-8 h-8 text-[#52CBB5] mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-sm text-[#0F2537]">No urgent Must Do tasks</p>
                <p className="text-xs text-[#8A99AD] mt-1">Take a breath or capture whatever is on your mind.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mustDoTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Could Do Section */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#0F2537] tracking-tight">
                Could Do
              </h2>
              <span className="bg-[#F0F4F8] text-[#6B7A90] text-xs font-semibold px-2 py-0.5 rounded-full">
                {couldDoTasks.length}
              </span>
            </div>
            <p className="text-xs text-[#8A99AD]">
              Low-pressure ideas & secondary tasks when you have extra bandwidth.
            </p>

            {couldDoTasks.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-4 text-center text-xs text-[#8A99AD]">
                No low-priority items listed.
              </div>
            ) : (
              <div className="space-y-3">
                {couldDoTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </section>

          {/* Completed Tasks Accordion (Collapsed by Default) */}
          {completedTasks.length > 0 && (
            <section className="pt-2">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center justify-between p-3.5 bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] text-xs font-semibold text-[#6B7A90] hover:bg-[#F0F4F8] transition-all"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Completed Tasks ({completedTasks.length})</span>
                </div>
                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showCompleted && (
                <div className="space-y-3 mt-3">
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};
