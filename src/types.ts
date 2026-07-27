export type PriorityType = 'must' | 'could';

export type CategoryType = 'School' | 'Work' | 'Personal' | 'Health' | 'Errands' | 'Finance';

export interface Task {
  id: string;
  title: string;
  notes?: string;
  priority: PriorityType;
  category: CategoryType;
  date?: string; // Day task should happen, e.g. "Tuesday", "Tomorrow", "August 4", "Today"
  reminderTime?: string; // e.g. "9:00 AM", "12:00 PM", "2:00 PM", "6:00 PM", "9:00 PM"
  repeat?: string; // "Never", "Daily", "Weekly", "Monthly", "Every Monday", "Every Tuesday", "Custom"
  repeatEnds?: string; // "Never", "Specific Date", "After X Days", "After X Occurrences"
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  aiReasoning?: string;
  missingInfoWarning?: string;
}

export type CaptureStatus = 'processing' | 'needs_clarification' | 'ready_for_review' | 'completed' | 'offline_queued' | 'emotional_non_task' | 'error_saved';

export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  contextField?: 'date' | 'reminderTime' | 'category';
}

export interface CaptureItem {
  id: string;
  rawText: string;
  type: 'text' | 'voice';
  audioDurationSeconds?: number;
  status: CaptureStatus;
  createdAt: string;
  extractedTasks?: Partial<Task>[];
  clarificationQuestion?: ClarificationQuestion;
  clarificationAnswer?: string;
  emotionalFeedback?: string;
  errorMessage?: string;
}

export interface AppNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'reminder' | 'brain_dump';
  time: string;
  active: boolean;
}

export interface AppSettings {
  defaultReminderTime: string;
  brainDumpReminderTime: string;
  brainDumpEnabled: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'calm_dark';
  offlineMode: boolean;
}

export type ActiveTab = 'home' | 'capture' | 'calendar' | 'inbox' | 'settings';
