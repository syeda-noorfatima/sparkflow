import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle2, Bell } from 'lucide-react';
import { isTaskScheduledOnDate, formatDateToYYYYMMDD, getTodayDate, getTodayYYYYMMDD } from '../utils/dateUtils';

export const CalendarView: React.FC = () => {
  const { tasks, setSelectedTaskId, setIsCaptureModalOpen } = useApp();
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Base reference date anchor for task relative parsing
  const refDate = React.useMemo(() => getTodayDate(), []);

  // Current anchor date for week/month navigation
  const [currentAnchor, setCurrentAnchor] = useState<Date>(() => getTodayDate());

  // Calculate 7 week days starting Sunday
  const weekDays = React.useMemo(() => {
    const days = [];
    const Sunday = new Date(currentAnchor);
    Sunday.setDate(currentAnchor.getDate() - currentAnchor.getDay());

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(Sunday);
      d.setDate(Sunday.getDate() + i);
      const dateStr = formatDateToYYYYMMDD(d);
      const name = dayNames[d.getDay()];
      const display = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      days.push({ name, dateStr, display, dateObj: d });
    }
    return days;
  }, [currentAnchor]);

  // Calculate month days grid
  const monthData = React.useMemo(() => {
    const year = currentAnchor.getFullYear();
    const month = currentAnchor.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 for Sunday
    const totalDays = lastDay.getDate();

    const days = [];
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({
        dayNum: i,
        dateStr: formatDateToYYYYMMDD(d),
      });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      title: `${monthNames[month]} ${year}`,
      startOffset: startDayOfWeek,
      days,
    };
  }, [currentAnchor]);

  const handlePrev = () => {
    const newDate = new Date(currentAnchor);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentAnchor(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentAnchor);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentAnchor(newDate);
  };

  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(t => isTaskScheduledOnDate(t, dateStr, refDate));
  };

  const todayStr = getTodayYYYYMMDD();

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4 pt-3">
      {/* Calendar Header & View Switcher */}
      <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-3.5 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#52CBB5]" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-[#0F2537]">
                {viewMode === 'week' ? 'Weekly Schedule' : monthData.title}
              </h2>
              <div className="flex items-center gap-0.5 ml-1">
                <button
                  onClick={handlePrev}
                  className="p-1 hover:bg-[#F0F4F8] rounded-full transition-colors text-[#0F2537]"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-[#F0F4F8] rounded-full transition-colors text-[#0F2537]"
                  aria-label="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#8A99AD]">ADHD Glanceable Schedule</p>
          </div>
        </div>

        {/* View Switcher Pill */}
        <div className="flex bg-[#F0F4F8] p-1 rounded-full text-xs font-semibold">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewMode === 'week' ? 'bg-[#FFFFFF] text-[#0F2537] shadow-xs' : 'text-[#6B7A90]'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-full transition-all ${
              viewMode === 'month' ? 'bg-[#FFFFFF] text-[#0F2537] shadow-xs' : 'text-[#6B7A90]'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Empty State Banner when no scheduled tasks exist */}
      {tasks.length === 0 && (
        <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[20px] p-6 text-center space-y-3 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
          <CalendarIcon className="w-8 h-8 text-[#52CBB5] mx-auto opacity-80" />
          <div>
            <h3 className="text-sm font-bold text-[#0F2537]">No scheduled tasks yet</h3>
            <p className="text-xs text-[#8A99AD] mt-1">
              Capture your thoughts with dates or times and they will automatically appear on your schedule.
            </p>
          </div>
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="px-4 py-2 bg-[#52CBB5] hover:bg-[#42b5a0] text-white text-xs font-bold rounded-full transition-all inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Capture Scheduled Task</span>
          </button>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="space-y-3">
          <p className="text-xs text-[#8A99AD] font-medium">
            💡 Weekly view uses day cards instead of crowded hourly timelines to reduce executive overwhelm.
          </p>

          <div className="space-y-3">
            {weekDays.map(day => {
              const dayTasks = getTasksForDate(day.dateStr);
              const isToday = day.dateStr === todayStr;

              return (
                <div
                  key={day.dateStr}
                  className={`bg-[#FFFFFF] rounded-[20px] p-4 border transition-all shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)] ${
                    isToday ? 'border-[#52CBB5] ring-2 ring-[#52CBB5]/20' : 'border-[#E8ECEF]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8ECEF]">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0F2537]">
                        {day.name} ({day.display})
                      </span>
                      {isToday && (
                        <span className="bg-[#52CBB5] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-medium text-[#8A99AD]">
                      {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Tasks list inside day card */}
                  {dayTasks.length === 0 ? (
                    <div className="py-2 text-[11px] text-[#8A99AD] italic">
                      No tasks scheduled for this day.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`p-2.5 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between ${
                            t.completed
                              ? 'bg-[#F6F8F9] border-[#E8ECEF] opacity-60'
                              : t.priority === 'must'
                              ? 'bg-[#D8CEFA]/20 border-[#D8CEFA] hover:bg-[#D8CEFA]/30'
                              : 'bg-[#F0F4F8] border-[#E8ECEF] hover:bg-[#E8ECEF]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                t.priority === 'must' ? 'bg-[#52CBB5]' : 'bg-[#8A99AD]'
                              }`} />
                            )}
                            <span className={`text-xs font-semibold text-[#0F2537] truncate ${t.completed ? 'line-through text-[#8A99AD]' : ''}`}>
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.reminderTime && t.reminderTime !== 'Not Set' && (
                              <span className="text-[10px] text-[#0F2537] font-medium bg-[#D8CEFA]/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Bell className="w-2.5 h-2.5" />
                                <span>{t.reminderTime}</span>
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-[#8A99AD] bg-white px-2 py-0.5 rounded-full border border-[#E8ECEF]">
                              {t.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-[#FFFFFF] border border-[#E8ECEF] rounded-[24px] p-4 space-y-3 shadow-[0_4px_20px_-2px_rgba(15,37,55,0.05)]">
          <p className="text-xs text-[#8A99AD] font-medium">
            📅 Task titles displayed directly on date cells so you know what is due at a glance.
          </p>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-[#8A99AD] pb-2 border-b border-[#E8ECEF]">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset cells for starting day of month */}
            {Array.from({ length: monthData.startOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="h-16 bg-[#F6F8F9]/50 rounded-xl" />
            ))}

            {monthData.days.map(day => {
              const dayTasks = getTasksForDate(day.dateStr);
              const isToday = day.dateStr === todayStr;

              return (
                <div
                  key={day.dayNum}
                  className={`min-h-[70px] p-1 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#52CBB5]/10 border-[#52CBB5] ring-1 ring-[#52CBB5]'
                      : dayTasks.length > 0
                      ? 'bg-[#F6F8F9] border-[#E8ECEF]'
                      : 'bg-white border-[#E8ECEF]/60'
                  }`}
                >
                  <span className={`text-[11px] font-bold px-1 rounded-md ${
                    isToday ? 'bg-[#52CBB5] text-white w-fit' : 'text-[#0F2537]'
                  }`}>
                    {day.dayNum}
                  </span>

                  {/* Directly visible task titles */}
                  <div className="space-y-0.5 overflow-hidden my-0.5">
                    {dayTasks.slice(0, 2).map(t => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`text-[9px] font-semibold px-1 py-0.5 rounded truncate cursor-pointer ${
                          t.priority === 'must' ? 'bg-[#0F2537] text-white' : 'bg-[#D8CEFA] text-[#0F2537]'
                        }`}
                        title={t.title}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <span className="text-[8px] font-bold text-[#52CBB5] block px-0.5">
                        +{dayTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

