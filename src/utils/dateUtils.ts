import { Task } from '../types';

/**
 * Single source of truth for the current local start-of-day Date.
 */
export function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Single source of truth for the current local date as YYYY-MM-DD.
 */
export function getTodayYYYYMMDD(): string {
  return formatDateToYYYYMMDD(getTodayDate());
}

/**
 * Formats a Date object to YYYY-MM-DD string in local time.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses a date string like "Today", "Tomorrow", "Thursday", "August 20", "2026-08-15"
 * into a valid Date object or null if "Not Set" / invalid.
 */
export function parseTaskPrimaryDate(dateStr?: string, refDate: Date = getTodayDate()): Date | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase() === 'not set') {
    return null;
  }

  const clean = dateStr.trim().toLowerCase();
  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  const refDay = refDate.getDate();

  if (clean === 'today') {
    return new Date(refYear, refMonth, refDay);
  }

  if (clean === 'tomorrow') {
    return new Date(refYear, refMonth, refDay + 1);
  }

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDayIdx = weekdays.indexOf(clean);
  if (targetDayIdx !== -1) {
    const currentDayIdx = refDate.getDay();
    let diff = targetDayIdx - currentDayIdx;
    if (diff < 0) diff += 7;
    return new Date(refYear, refMonth, refDay + diff);
  }

  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Month & Day parsing e.g. "August 20", "Aug 20", "July 29"
  let parsedMs = Date.parse(clean);
  if (isNaN(parsedMs)) {
    parsedMs = Date.parse(`${clean}, ${refYear}`);
  }

  if (!isNaN(parsedMs)) {
    const d = new Date(parsedMs);
    // Standardize to local start-of-day
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

/**
 * Checks if a task is scheduled on a given target calendar date YYYY-MM-DD.
 * Takes into account date, repeat, and repeatEnds.
 */
export function isTaskScheduledOnDate(
  task: Task,
  targetDateStr: string,
  refDate: Date = getTodayDate()
): boolean {
  // 1. Must have a valid Date field
  const primaryDate = parseTaskPrimaryDate(task.date, refDate);
  if (!primaryDate) return false;

  const primaryDateFormatted = formatDateToYYYYMMDD(primaryDate);

  // Parse target date YYYY-MM-DD
  const [tY, tM, tD] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(tY, tM - 1, tD);

  // Target date cannot be before the task's primary start date
  if (targetDate < primaryDate) {
    return false;
  }

  // Exact match with primary date
  if (targetDateStr === primaryDateFormatted) {
    return true;
  }

  // 2. Handle Repeat logic
  const repeat = (task.repeat || '').trim().toLowerCase();
  if (!repeat || repeat === 'never' || repeat === 'not set') {
    return false;
  }

  // Calculate day difference
  const diffTime = targetDate.getTime() - primaryDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  // Check repeatEnds constraint
  const repeatEnds = (task.repeatEnds || '').trim().toLowerCase();
  if (repeatEnds.startsWith('after ') && repeatEnds.includes('day')) {
    const maxDaysMatch = repeatEnds.match(/\d+/);
    if (maxDaysMatch) {
      const maxDays = parseInt(maxDaysMatch[0], 10);
      if (diffDays >= maxDays) return false;
    }
  } else if (repeatEnds.startsWith('after ') && repeatEnds.includes('occurrence')) {
    const maxOccurMatch = repeatEnds.match(/\d+/);
    if (maxOccurMatch) {
      const maxOccur = parseInt(maxOccurMatch[0], 10);
      if (repeat === 'daily' && diffDays >= maxOccur) return false;
      if (repeat === 'weekly' && Math.floor(diffDays / 7) >= maxOccur) return false;
    }
  } else if (repeatEnds !== 'never' && repeatEnds !== 'not set' && repeatEnds !== '') {
    const endDate = parseTaskPrimaryDate(repeatEnds, refDate);
    if (endDate && targetDate > endDate) {
      return false;
    }
  }

  // Match repeat frequency
  if (repeat === 'daily' || repeat === 'every day') {
    return true;
  }

  if (repeat === 'weekly') {
    return diffDays % 7 === 0;
  }

  if (repeat === 'monthly') {
    return targetDate.getDate() === primaryDate.getDate();
  }

  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < weekdays.length; i++) {
    if (repeat.includes(weekdays[i])) {
      return targetDate.getDay() === i;
    }
  }

  return false;
}
