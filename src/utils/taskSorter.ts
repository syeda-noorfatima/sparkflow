import { Task } from '../types';

/**
 * Parses time string like "9:00 AM", "2:00 PM", "18:00" into minutes from midnight.
 * Returns null if string is missing, invalid, or "Not Set".
 */
export function parseTimeInMinutes(timeStr?: string): number | null {
  if (!timeStr || timeStr.trim() === '' || timeStr.toLowerCase() === 'not set') {
    return null;
  }
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === 'PM' && hour < 12) {
    hour += 12;
  } else if (ampm === 'AM' && hour === 12) {
    hour = 0;
  }
  return hour * 60 + minute;
}

/**
 * Calculates day offset relative to refDate (e.g., 0 = Today, 1 = Tomorrow, 2-7 = next 7 days).
 * Returns Infinity if no date is specified or "Not Set".
 */
export function getDaysOffset(dateStr?: string, refDate: Date = new Date()): number {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'not set') {
    return Infinity;
  }

  const clean = dateStr.trim().toLowerCase();

  if (clean === 'today') return 0;
  if (clean === 'tomorrow') return 1;

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const refDay = refDate.getDay();
  const targetDay = weekdays.indexOf(clean);

  if (targetDay !== -1) {
    let diff = targetDay - refDay;
    if (diff < 0) diff += 7;
    return diff;
  }

  // Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const refStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const diffTime = target.getTime() - refStart.getTime();
    const days = Math.round(diffTime / (1000 * 3600 * 24));
    return days < 0 ? 0 : days;
  }

  // Fallback date parsing
  let parsed = Date.parse(clean);
  if (isNaN(parsed)) {
    parsed = Date.parse(`${clean}, ${refDate.getFullYear()}`);
  }

  if (!isNaN(parsed)) {
    const target = new Date(parsed);
    const refStart = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
    const diffTime = target.getTime() - refStart.getTime();
    const days = Math.round(diffTime / (1000 * 3600 * 24));
    return days < 0 ? 0 : days;
  }

  return Infinity;
}

/**
 * Determines if a task's reminder time is approaching in the next few hours (within 3 hours or upcoming today).
 */
export function isReminderApproaching(reminderTimeStr?: string, refDate: Date = new Date()): boolean {
  const reminderMins = parseTimeInMinutes(reminderTimeStr);
  if (reminderMins === null) return false;

  const currentMins = refDate.getHours() * 60 + refDate.getMinutes();
  const diff = reminderMins - currentMins;

  // Approaching if within the next 3 hours (180 mins) or up to 30 mins past due today
  return diff >= -30 && diff <= 180;
}

/**
 * Deterministically generates a short reason for the Next Priority task.
 */
export function getNextPriorityReason(task: Task, refDate: Date = new Date()): string {
  const isApproaching = isReminderApproaching(task.reminderTime, refDate);
  if (isApproaching) {
    return 'Reminder coming up';
  }

  const days = getDaysOffset(task.date, refDate);
  if (days === 0) {
    return 'Due today';
  }
  if (days === 1) {
    return 'Due tomorrow';
  }

  const isDaily = Boolean(task.repeat && task.repeat.toLowerCase().includes('daily'));
  if (isDaily) {
    return 'Daily habit';
  }

  if (days > 1 && days <= 7) {
    return 'Coming up this week';
  }
  if (days > 7 && days < Infinity) {
    return 'Upcoming commitment';
  }

  return 'Ready whenever you are';
}

/**
 * Determines the consequence priority tier for tasks within the same date / schedule rank.
 * Lower score = higher priority / severity.
 * 1. Academic or work submissions with explicit due times.
 * 2. Bills, appointments, and official obligations.
 * 3. Health tasks when their reminder time is approaching.
 * 4. Flexible errands.
 * 5. General tasks.
 */
export function getConsequenceScore(task: Task, isApproaching: boolean): number {
  const cat = (task.category || '').toLowerCase();
  const text = `${task.title || ''} ${task.notes || ''}`.toLowerCase();
  const hasTime = Boolean(task.reminderTime && task.reminderTime !== 'Not Set');

  // 1. Academic or work submissions with explicit due times
  const isAcademicWork = cat === 'school' || cat === 'work' ||
    text.includes('assignment') || text.includes('submit') || text.includes('due') ||
    text.includes('exam') || text.includes('paper') || text.includes('report') ||
    text.includes('project') || text.includes('homework') || text.includes('essay');

  if (isAcademicWork) {
    return hasTime ? 1.0 : 1.2;
  }

  // 2. Bills, appointments, and official obligations
  const isOfficialObligation = cat === 'finance' ||
    text.includes('bill') || text.includes('pay') || text.includes('appointment') ||
    text.includes('tax') || text.includes('rent') || text.includes('scholarship') ||
    text.includes('office') || text.includes('dentist') || text.includes('doctor') ||
    text.includes('bank') || text.includes('check-in') || text.includes('insurance');

  if (isOfficialObligation) {
    return 2.0;
  }

  // 3. Health tasks (when reminder time is approaching, moves up to rank 1.5)
  const isHealth = cat === 'health' ||
    text.includes('medicine') || text.includes('tablet') || text.includes('prescription') ||
    text.includes('vitamin') || text.includes('pill') || text.includes('gym') || text.includes('workout');

  if (isHealth) {
    return isApproaching ? 1.5 : 3.0;
  }

  // 4. Flexible errands
  const isErrand = cat === 'errands' ||
    text.includes('buy') || text.includes('groceries') || text.includes('store') ||
    text.includes('pharmacy') || text.includes('pick up') || text.includes('milk') || text.includes('cvs');

  if (isErrand) {
    return 4.0;
  }

  // 5. General tasks
  return 5.0;
}

/**
 * SparkFlow Deterministic Task Ordering Algorithm:
 * 1. Active tasks before Completed tasks.
 * 2. Must Do tasks strictly before Could Do tasks.
 * 3. Among Must Do tasks:
 *    a. Today with Approaching Reminder
 *    b. Today standard tasks
 *    c. Tomorrow tasks
 *    d. Tasks occurring within next 7 days
 *    e. Future tasks ordered by nearest date
 *    f. Tasks with no date
 * 4. Within same schedule rank / date: Sort by consequence tier (Academic/Work -> Bills/Appointments -> Health -> Errands -> General).
 * 5. Recurring tasks (e.g. medication) only move to top when reminder time is approaching.
 */
export function sortSparkFlowTasks(tasks: Task[], refDate: Date = new Date()): Task[] {
  return [...tasks].sort((a, b) => {
    // 1. Completion status (active before completed)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // 2. Priority: Must Do before Could Do
    if (a.priority !== b.priority) {
      return a.priority === 'must' ? -1 : 1;
    }

    // Task A metrics
    const aDays = getDaysOffset(a.date, refDate);
    const aTimeMins = parseTimeInMinutes(a.reminderTime);
    const aApproaching = isReminderApproaching(a.reminderTime, refDate);
    const aRecurring = Boolean(a.repeat && a.repeat !== 'Never' && a.repeat !== '' && a.repeat.toLowerCase() !== 'not set');

    // Task B metrics
    const bDays = getDaysOffset(b.date, refDate);
    const bTimeMins = parseTimeInMinutes(b.reminderTime);
    const bApproaching = isReminderApproaching(b.reminderTime, refDate);
    const bRecurring = Boolean(b.repeat && b.repeat !== 'Never' && b.repeat !== '' && b.repeat.toLowerCase() !== 'not set');

    const getScheduleRank = (days: number, approaching: boolean, recurring: boolean): number => {
      if (days === 0) {
        if (approaching) return 0; // Today with approaching reminder -> Top priority
        if (recurring) return 1.2; // Recurring without approaching reminder -> below non-recurring Today tasks
        return 1; // Today standard
      }
      if (days === 1) {
        if (approaching) return 1.8; // Approaching reminder tomorrow
        return 2; // Tomorrow
      }
      if (days >= 2 && days <= 7) {
        return 3; // Within next 7 days
      }
      if (days > 7 && days < Infinity) {
        return 4; // Future beyond 7 days
      }
      return 5; // No date
    };

    const aRank = getScheduleRank(aDays, aApproaching, aRecurring);
    const bRank = getScheduleRank(bDays, bApproaching, bRecurring);

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    // Tie-breaker 1: Days offset
    if (aDays !== bDays) {
      return aDays - bDays;
    }

    // Tie-breaker 2: Consequence Priority Tier
    const aConsequence = getConsequenceScore(a, aApproaching);
    const bConsequence = getConsequenceScore(b, bApproaching);
    if (aConsequence !== bConsequence) {
      return aConsequence - bConsequence;
    }

    // Tie-breaker 3: Reminder Time (earlier time before later)
    if (aTimeMins !== null && bTimeMins !== null) {
      if (aTimeMins !== bTimeMins) return aTimeMins - bTimeMins;
    } else if (aTimeMins !== null && bTimeMins === null) {
      return -1;
    } else if (aTimeMins === null && bTimeMins !== null) {
      return 1;
    }

    // Tie-breaker 4: Non-recurring before recurring if no approaching reminder
    if (aRecurring !== bRecurring) {
      return aRecurring ? 1 : -1;
    }

    // Tie-breaker 5: Stable creation order
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
