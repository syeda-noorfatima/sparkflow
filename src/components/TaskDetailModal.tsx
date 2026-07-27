import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PriorityType } from '../types';
import { X, Check, Trash2, Calendar, Bell, Sparkles, Send, Repeat, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const { selectedTaskId, setSelectedTaskId, tasks, updateTask, deleteTask, toggleTaskComplete, applyAiEditToTask } = useApp();

  const task = tasks.find(t => t.id === selectedTaskId);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<PriorityType>('must');
  const [date, setDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [repeat, setRepeat] = useState('Never');
  const [repeatEnds, setRepeatEnds] = useState('Never');
  const [showNotes, setShowNotes] = useState(false);

  // AI Assistant Re-Edit prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isApplyingAi, setIsApplyingAi] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setPriority(task.priority);
      setDate(task.date || '');
      setReminderTime(task.reminderTime || '');
      setRepeat(task.repeat || 'Never');
      setRepeatEnds(task.repeatEnds || 'Never');
      setShowNotes(!!task.notes);
      setAiMessage(null);
    }
  }, [task]);

  if (!selectedTaskId || !task) return null;

  const handleSave = () => {
    updateTask(task.id, {
      title,
      notes,
      priority,
      date: date || undefined,
      reminderTime: reminderTime || undefined,
      repeat: repeat || 'Never',
      repeatEnds: repeatEnds || 'Never',
    });
    setSelectedTaskId(null);
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  const handleApplyAiInstruction = async () => {
    if (!aiPrompt.trim()) return;
    setIsApplyingAi(true);
    const result = await applyAiEditToTask(task.id, aiPrompt.trim());
    setIsApplyingAi(false);
    setAiMessage(result);
    setAiPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0F2537]/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] w-full max-w-lg rounded-t-[28px] sm:rounded-[24px] p-5 shadow-2xl border border-[#E8ECEF] space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* Header - Category is hidden */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E8ECEF]">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              priority === 'must' ? 'bg-[#52CBB5] text-white' : 'bg-[#F0F4F8] text-[#6B7A90]'
            }`}>
              {priority === 'must' ? 'Must Do' : 'Could Do'}
            </span>
          </div>

          <button
            onClick={() => setSelectedTaskId(null)}
            className="p-1.5 rounded-full text-[#8A99AD] hover:bg-[#F0F4F8] hover:text-[#0F2537]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-[11px] font-semibold text-[#8A99AD] uppercase tracking-wide block mb-1">
            Task Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#F6F8F9] border border-[#E8ECEF] rounded-[14px] px-3.5 py-2.5 text-sm font-bold text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
          />
        </div>

        {/* AI Natural Language Re-Editor */}
        <div className="bg-[#D8CEFA]/20 border border-[#D8CEFA] rounded-[18px] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F2537]">
            <Sparkles className="w-4 h-4 text-[#52CBB5]" />
            <span>AI Natural Language Assistant</span>
          </div>
          <p className="text-[11px] text-[#6B7A90]">
            Speak or type instructions like "Change date to Tuesday" or "Set reminder for 9:00 AM".
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Set date to Tuesday morning"
              className="flex-1 bg-white border border-[#E8ECEF] rounded-full px-3 py-1.5 text-xs text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleApplyAiInstruction()}
            />
            <button
              onClick={handleApplyAiInstruction}
              disabled={isApplyingAi || !aiPrompt.trim()}
              className="px-3.5 py-1.5 rounded-full bg-[#0F2537] text-white text-xs font-semibold hover:bg-[#1a354d] disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
              <span>Apply</span>
            </button>
          </div>

          {aiMessage && (
            <p className="text-[11px] text-[#52CBB5] font-semibold bg-white/80 px-2.5 py-1 rounded-lg">
              ✨ {aiMessage}
            </p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label className="text-[11px] font-semibold text-[#8A99AD] uppercase tracking-wide block mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityType)}
            className="w-full bg-[#F6F8F9] border border-[#E8ECEF] rounded-[14px] px-3.5 py-2.5 text-xs font-semibold text-[#0F2537]"
          >
            <option value="must">Must Do (High Priority)</option>
            <option value="could">Could Do (Low Urgency)</option>
          </select>
        </div>

        {/* SparkFlow ADHD Scheduling Section: When do I need to do this? */}
        <div className="bg-[#F6F8F9] border border-[#E8ECEF] rounded-[18px] p-3.5 space-y-3">
          <label className="text-[11px] font-bold text-[#0F2537] uppercase tracking-wide block">
            When do I need to do this?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Date */}
            <div>
              <label className="text-[11px] font-semibold text-[#8A99AD] block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#52CBB5]" />
                <span>Date</span>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g. Tomorrow, Tuesday, August 4"
                className="w-full bg-white border border-[#E8ECEF] rounded-[12px] px-3 py-2 text-xs font-semibold text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
              />
            </div>

            {/* 2. Reminder Time */}
            <div>
              <label className="text-[11px] font-semibold text-[#8A99AD] block mb-1 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-[#52CBB5]" />
                <span>Reminder Time</span>
              </label>
              <input
                type="text"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                placeholder="e.g. 9:00 AM, 2:00 PM, 6:00 PM"
                className="w-full bg-white border border-[#E8ECEF] rounded-[12px] px-3 py-2 text-xs font-semibold text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
              />
            </div>

            {/* 3. Repeat */}
            <div>
              <label className="text-[11px] font-semibold text-[#8A99AD] block mb-1 flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5 text-[#52CBB5]" />
                <span>Repeat</span>
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                className="w-full bg-white border border-[#E8ECEF] rounded-[12px] px-3 py-2 text-xs font-semibold text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
              >
                <option value="Never">Never</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Every Monday">Every Monday</option>
                <option value="Every Tuesday">Every Tuesday</option>
                <option value="Every Wednesday">Every Wednesday</option>
                <option value="Every Thursday">Every Thursday</option>
                <option value="Every Friday">Every Friday</option>
                <option value="Every Saturday">Every Saturday</option>
                <option value="Every Sunday">Every Sunday</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* 4. Repeat Ends */}
            <div>
              <label className="text-[11px] font-semibold text-[#8A99AD] block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#52CBB5]" />
                <span>Repeat Ends</span>
              </label>
              <input
                type="text"
                value={repeatEnds}
                onChange={(e) => setRepeatEnds(e.target.value)}
                placeholder="e.g. Never, After 10 Days"
                className="w-full bg-white border border-[#E8ECEF] rounded-[12px] px-3 py-2 text-xs font-semibold text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Progressive Disclosure: Notes */}
        <div>
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center justify-between w-full text-xs font-semibold text-[#6B7A90] py-1 hover:text-[#0F2537]"
          >
            <span>Notes & Context details</span>
            {showNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add extra context, links, or sub-details..."
              rows={3}
              className="w-full bg-[#F6F8F9] border border-[#E8ECEF] rounded-[14px] p-3 text-xs text-[#0F2537] focus:ring-2 focus:ring-[#52CBB5] focus:outline-none mt-1 resize-none"
            />
          )}
        </div>

        {/* AI Reasoning metadata */}
        {task.aiReasoning && (
          <div className="bg-[#F0F4F8] p-3 rounded-[14px] text-[11px] text-[#6B7A90]">
            <span className="font-semibold text-[#0F2537]">AI Note: </span>
            {task.aiReasoning}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8ECEF]">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 rounded-full text-xs font-semibold text-[#FF6B6B] hover:bg-[#FF6B6B]/10 flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                toggleTaskComplete(task.id);
                setSelectedTaskId(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                task.completed ? 'bg-[#F0F4F8] text-[#0F2537]' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {task.completed ? 'Mark Incomplete' : 'Complete Task'}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-[#52CBB5] text-white text-xs font-bold hover:bg-[#42b5a0] transition-all shadow-md shadow-[#52CBB5]/20 flex items-center gap-1"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
