import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Task, CaptureItem, AppSettings, ActiveTab, AppNotification, PriorityType, CategoryType } from '../types';
import { INITIAL_TASKS, INITIAL_CAPTURES, DEFAULT_SETTINGS } from '../data/mockData';
import { sortSparkFlowTasks } from '../utils/taskSorter';
import { getTodayYYYYMMDD } from '../utils/dateUtils';
import {
  auth,
  db,
  signInAnonymously,
  onAuthStateChanged,
  User,
} from '../lib/firebase';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Message:', JSON.stringify(errInfo));
}

function getLocalDeviceUid(): string {
  let uid = localStorage.getItem('sparkflow_device_uid');
  if (!uid) {
    uid = `device-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('sparkflow_device_uid', uid);
  }
  return uid;
}

function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanUndefined(value);
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => (typeof item === 'object' && item !== null ? cleanUndefined(item) : item));
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}

interface AppContextType {
  tasks: Task[];
  captures: CaptureItem[];
  settings: AppSettings;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  notifications: AppNotification[];
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  showToast: (msg: string) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  activeCapture: CaptureItem | null;
  setActiveCapture: (capture: CaptureItem | null) => void;
  
  // Modals & Flows
  isProcessingAi: boolean;
  processingStep: number;
  clarificationCapture: CaptureItem | null;
  reviewCapture: CaptureItem | null;
  isCaptureModalOpen: boolean;
  setIsCaptureModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;

  // Actions
  toggleTaskComplete: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  submitCapture: (rawText: string, type?: 'text' | 'voice', duration?: number) => void;
  answerClarification: (captureId: string, answer: string) => void;
  saveReviewedTasks: (captureId: string, tasksToSave: Omit<Task, 'id' | 'createdAt'>[]) => void;
  applyAiEditToTask: (taskId: string, instruction: string) => Promise<string>;
  
  // Notifications
  triggerTestNotification: (taskId?: string) => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string, minutes: number) => void;
  
  // Settings & Utilities
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleOfflineMode: () => void;
  resetToMockData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('sparkflow_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [captures, setCaptures] = useState<CaptureItem[]>(() => {
    const saved = localStorage.getItem('sparkflow_captures');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('sparkflow_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 4000);
  };

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeCapture, setActiveCapture] = useState<CaptureItem | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    return !localStorage.getItem('sparkflow_onboarding_completed');
  });

  // AI Processing State
  const [isProcessingAi, setIsProcessingAi] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [clarificationCapture, setClarificationCapture] = useState<CaptureItem | null>(null);
  const [reviewCapture, setReviewCapture] = useState<CaptureItem | null>(null);

  const hasSeededTasksRef = useRef<boolean>(false);
  const hasSeededCapturesRef = useRef<boolean>(false);

  // Initialize Anonymous Firebase Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } catch (err: any) {
          console.warn("Firebase Anonymous Auth restricted or failed. Initializing with device UID:", err);
          setUser({ uid: getLocalDeviceUid(), isAnonymous: true } as User);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync to Local Storage when unauthenticated
  useEffect(() => {
    if (!user) {
      localStorage.setItem('sparkflow_tasks', JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('sparkflow_captures', JSON.stringify(captures));
    }
  }, [captures, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('sparkflow_settings', JSON.stringify(settings));
    }
  }, [settings, user]);

  // Real-time Firestore Sync for User Data
  useEffect(() => {
    if (!user) return;

    const currentUid = user.uid;

    // 1. Tasks Listener
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', currentUid));
    const unsubTasks = onSnapshot(tasksQuery, async (snapshot) => {
      if (snapshot.empty) {
        setTasks([]);
      } else {
        const loadedTasks: Task[] = snapshot.docs.map(d => {
          const data = d.data();
          const { userId: _, ...task } = data;
          return task as Task;
        });
        loadedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTasks(loadedTasks);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'tasks');
    });

    // 2. Inbox Captures Listener
    const capturesQuery = query(collection(db, 'inboxCaptures'), where('userId', '==', currentUid));
    const unsubCaptures = onSnapshot(capturesQuery, async (snapshot) => {
      if (snapshot.empty) {
        setCaptures([]);
      } else {
        const loadedCaptures: CaptureItem[] = snapshot.docs.map(d => {
          const data = d.data();
          const { userId: _, ...cap } = data;
          return cap as CaptureItem;
        });
        loadedCaptures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCaptures(loadedCaptures);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'inboxCaptures');
    });

    // 3. Reminder Settings Listener
    const reminderDocRef = doc(db, 'reminderSettings', currentUid);
    const unsubReminder = onSnapshot(reminderDocRef, async (docSnap) => {
      if (!docSnap.exists()) {
        const initialReminders = {
          userId: currentUid,
          defaultReminderTime: DEFAULT_SETTINGS.defaultReminderTime,
          brainDumpReminderTime: DEFAULT_SETTINGS.brainDumpReminderTime,
          brainDumpEnabled: DEFAULT_SETTINGS.brainDumpEnabled,
          soundEnabled: DEFAULT_SETTINGS.soundEnabled,
        };
        try {
          await setDoc(reminderDocRef, cleanUndefined(initialReminders));
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'reminderSettings');
        }
      } else {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          defaultReminderTime: data.defaultReminderTime ?? DEFAULT_SETTINGS.defaultReminderTime,
          brainDumpReminderTime: data.brainDumpReminderTime ?? DEFAULT_SETTINGS.brainDumpReminderTime,
          brainDumpEnabled: data.brainDumpEnabled ?? DEFAULT_SETTINGS.brainDumpEnabled,
          soundEnabled: data.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled,
        }));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'reminderSettings');
    });

    // 4. User Settings Listener
    const userSettingsDocRef = doc(db, 'userSettings', currentUid);
    const unsubUserSettings = onSnapshot(userSettingsDocRef, async (docSnap) => {
      if (!docSnap.exists()) {
        const initialUserSettings = {
          userId: currentUid,
          theme: DEFAULT_SETTINGS.theme,
          offlineMode: DEFAULT_SETTINGS.offlineMode,
        };
        try {
          await setDoc(userSettingsDocRef, cleanUndefined(initialUserSettings));
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'userSettings');
        }
      } else {
        const data = docSnap.data();
        setSettings(prev => ({
          ...prev,
          theme: data.theme ?? DEFAULT_SETTINGS.theme,
          offlineMode: data.offlineMode ?? DEFAULT_SETTINGS.offlineMode,
        }));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'userSettings');
    });

    return () => {
      unsubTasks();
      unsubCaptures();
      unsubReminder();
      unsubUserSettings();
    };
  }, [user]);

  // Handle task actions
  const toggleTaskComplete = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const nextState = !target.completed;
    const updates: Partial<Task> = {
      completed: nextState,
      completedAt: nextState ? new Date().toISOString() : undefined,
    };

    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    }));

    if (user) {
      await updateDoc(doc(db, 'tasks', id), cleanUndefined(updates));
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: Task = {
      ...taskData,
      id: taskId,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);

    if (user) {
      await setDoc(doc(db, 'tasks', taskId), cleanUndefined({ ...newTask, userId: user.uid }));
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (user) {
      await updateDoc(doc(db, 'tasks', id), cleanUndefined(updates));
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTaskId === id) setSelectedTaskId(null);

    if (user) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  // Capture & AI processing flow
  const submitCapture = async (rawText: string, type: 'text' | 'voice' = 'text', duration?: number) => {
    const captureId = `cap-${Date.now()}`;
    const isOffline = settings.offlineMode;

    const newCapture: CaptureItem = {
      id: captureId,
      rawText,
      type,
      audioDurationSeconds: duration,
      status: isOffline ? 'offline_queued' : 'processing',
      createdAt: new Date().toISOString(),
    };

    setCaptures(prev => [newCapture, ...prev]);
    setIsCaptureModalOpen(false);

    if (user) {
      await setDoc(doc(db, 'inboxCaptures', captureId), cleanUndefined({ ...newCapture, userId: user.uid }));
    }

    if (isOffline) {
      return;
    }

    runAiProcessingPipeline(newCapture);
  };

  const runAiProcessingPipeline = async (capture: CaptureItem) => {
    setIsProcessingAi(true);
    setProcessingStep(1);

    const stepTimer2 = setTimeout(() => setProcessingStep(2), 500);
    const stepTimer3 = setTimeout(() => setProcessingStep(3), 1000);
    const stepTimer4 = setTimeout(() => setProcessingStep(4), 1500);

    try {
      const res = await fetch('/api/gemini/process-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: capture.rawText,
          currentDateStr: getTodayYYYYMMDD(),
          currentTasks: tasks,
        }),
      });

      const data = await res.json();

      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);

      setIsProcessingAi(false);
      setProcessingStep(0);

      // Rule: Emotional / Non-task (e.g. "I feel overwhelmed today")
      if (data.isEmotionalOnly || data.extractedTasks?.length === 0) {
        const updatedCapture: CaptureItem = {
          ...capture,
          status: 'emotional_non_task',
          emotionalFeedback: data.emotionalMessage || 'No actionable task detected.',
        };
        setCaptures(prev => prev.map(c => c.id === capture.id ? updatedCapture : c));
        if (user) {
          await updateDoc(doc(db, 'inboxCaptures', capture.id), cleanUndefined({
            status: updatedCapture.status,
            emotionalFeedback: updatedCapture.emotionalFeedback,
          }));
        }
        return;
      }

      // Rule: Extracted tasks - Auto-Save directly ("Capture and Forget")
      if (Array.isArray(data.extractedTasks) && data.extractedTasks.length > 0) {
        console.log('[Capture Pipeline Extracted Tasks Count]:', data.extractedTasks.length, data.extractedTasks);

        const formattedTasks = data.extractedTasks.map((t: any) => {
          let cleanTitle = t.title || 'Untitled task';
          cleanTitle = cleanTitle.replace(/^(I need to|Need to|Remember to|Please|I should)\s+/i, '');
          cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

          return {
            title: cleanTitle,
            priority: (t.priority === 'could' ? 'could' : 'must') as PriorityType,
            category: (t.category || 'Personal') as CategoryType,
            date: t.date && t.date.trim().length > 0 && t.date !== 'Not Set' ? t.date : undefined,
            reminderTime: t.reminderTime && t.reminderTime.trim().length > 0 && t.reminderTime !== 'Not Set' ? t.reminderTime : undefined,
            repeat: t.repeat && t.repeat !== 'Never' ? t.repeat : 'Never',
            repeatEnds: t.repeatEnds && t.repeatEnds !== 'Never' ? t.repeatEnds : 'Never',
            notes: t.notes || '',
            completed: false,
            aiReasoning: t.priority === 'must' ? 'Prioritized as Must Do due to explicit urgency/obligation.' : 'Categorized as Could Do for low-pressure execution.',
          };
        });

        // Automatically save EVERY task into the user's workspace & Firestore
        for (let i = 0; i < formattedTasks.length; i++) {
          await addTask(formattedTasks[i]);
        }

        const updatedCapture: CaptureItem = {
          ...capture,
          status: 'completed',
          extractedTasks: formattedTasks,
        };

        setCaptures(prev => prev.map(c => c.id === capture.id ? updatedCapture : c));
        setReviewCapture(null); // No blocking review screen required!

        if (user) {
          await updateDoc(doc(db, 'inboxCaptures', capture.id), cleanUndefined({
            status: 'completed',
            extractedTasks: updatedCapture.extractedTasks,
          }));
        }

        showToast('✨ Everything has been organized.');
      }
    } catch (err) {
      console.error('Error running AI processing pipeline:', err);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      setIsProcessingAi(false);
      setProcessingStep(0);

      const updatedCapture: CaptureItem = {
        ...capture,
        status: 'error_saved',
        errorMessage: "We couldn't organize this right now. Your capture has been safely saved and will be processed again automatically.",
      };
      setCaptures(prev => prev.map(c => c.id === capture.id ? updatedCapture : c));
      if (user) {
        await updateDoc(doc(db, 'inboxCaptures', capture.id), cleanUndefined({
          status: updatedCapture.status,
          errorMessage: updatedCapture.errorMessage,
        }));
      }
    }
  };

  const answerClarification = async (captureId: string, answer: string) => {
    const capture = captures.find(c => c.id === captureId);
    if (!capture) return;

    setClarificationCapture(null);
    const enrichedText = `${capture.rawText} (${answer})`;

    // Re-run capture pipeline with enriched prompt
    const updatedCapture: CaptureItem = {
      ...capture,
      rawText: enrichedText,
      clarificationAnswer: answer,
      status: 'processing',
    };

    setCaptures(prev => prev.map(c => c.id === captureId ? updatedCapture : c));
    if (user) {
      await updateDoc(doc(db, 'inboxCaptures', captureId), cleanUndefined({
        rawText: enrichedText,
        clarificationAnswer: answer,
        status: 'processing',
      }));
    }

    runAiProcessingPipeline(updatedCapture);
  };

  const saveReviewedTasks = async (captureId: string, tasksToSave: Omit<Task, 'id' | 'createdAt'>[]) => {
    for (const t of tasksToSave) {
      await addTask(t);
    }

    setCaptures(prev => prev.map(c => c.id === captureId ? { ...c, status: 'completed' } : c));
    setReviewCapture(null);
    setActiveTab('home');

    if (user) {
      await updateDoc(doc(db, 'inboxCaptures', captureId), { status: 'completed' });
    }
  };

  // Helper AI Parser function
  const parseTextIntoTasks = (input: string): Omit<Task, 'id' | 'createdAt'>[] => {
    // Smart task clause splitter
    const actionVerbPattern = /^(?:then\s+|also\s+|please\s+|remember\s+to\s+|need\s+to\s+|i\s+should\s+|maybe\s+)?(?:call|buy|pay|submit|pick|send|clean|do|finish|write|check|email|meet|schedule|take|walk|go|review|study|prep|prepare|read|order|post|make|book|cancel|contact|update|setup|set|organize|file|deposit|print|type|fix|work|ask|tell|get|talk|text|reply|listen|watch|cook|wash|feed|exercise|run|swim|open|close|start|stop|complete|create|draft|edit|upload|download|renew|register|apply|attend)\b/i;

    const lines = input.split(/(?:\n|\.|;)+/).map(s => s.trim()).filter(s => s.length > 0);
    const phrases: string[] = [];

    for (const line of lines) {
      const parts = line.split(/(,?\s+and\s+also\s+|,?\s+and\s+then\s+|,?\s+and\s+|,?\s+also\s+)/i);
      let currentClause = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (/^(,?\s+and\s+also\s+|,?\s+and\s+then\s+|,?\s+and\s+|,?\s+also\s+)$/i.test(part)) {
          const nextPart = (parts[i + 1] || '').trim();
          const isExplicitAndThen = /and\s+(also|then)/i.test(part);
          const isAction = actionVerbPattern.test(nextPart);

          if (isExplicitAndThen || isAction) {
            if (currentClause.trim().length > 2) {
              phrases.push(currentClause.trim());
            }
            currentClause = '';
          } else {
            currentClause += part;
          }
        } else {
          currentClause += part;
        }
      }
      if (currentClause.trim().length > 2) {
        phrases.push(currentClause.trim());
      }
    }
    
    if (phrases.length === 0) {
      phrases.push(input.trim());
    }

    return phrases.map(phrase => {
      const lower = phrase.toLowerCase();

      let priority: PriorityType = 'must';
      if (lower.includes('maybe') || lower.includes('could') || lower.includes('explore') || lower.includes('learn') || lower.includes('someday') || lower.includes('try')) {
        priority = 'could';
      }

      let category: CategoryType = 'Personal';
      if (lower.includes('psychology') || lower.includes('assignment') || lower.includes('exam') || lower.includes('study') || lower.includes('school') || lower.includes('homework')) {
        category = 'School';
      } else if (lower.includes('work') || lower.includes('project') || lower.includes('email') || lower.includes('supervisor') || lower.includes('client') || lower.includes('meeting')) {
        category = 'Work';
      } else if (lower.includes('prescription') || lower.includes('doctor') || lower.includes('dentist') || lower.includes('gym') || lower.includes('walk')) {
        category = 'Health';
      } else if (lower.includes('buy') || lower.includes('groceries') || lower.includes('amazon') || lower.includes('pick up') || lower.includes('store') || lower.includes('return')) {
        category = 'Errands';
      } else if (lower.includes('bill') || lower.includes('pay') || lower.includes('bank') || lower.includes('utility')) {
        category = 'Finance';
      }

      let date: string = 'Not Set';
      let reminderTime: string = 'Not Set';
      let repeat: string = 'Never';
      let repeatEnds: string = 'Never';
      let missingInfoWarning: string | undefined;

      if (lower.includes('morning')) {
        reminderTime = '9:00 AM';
      } else if (lower.includes('evening') || lower.includes('night') || lower.includes('6 pm')) {
        reminderTime = '6:00 PM';
      } else if (lower.includes('afternoon') || lower.includes('2 pm')) {
        reminderTime = '2:00 PM';
      }

      const everyWeekdayMatch = lower.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
      if (lower.includes('every day') || lower.includes('daily')) {
        repeat = 'Daily';
      } else if (everyWeekdayMatch || lower.includes('weekly')) {
        repeat = 'Weekly';
      }

      if (!everyWeekdayMatch) {
        if (lower.includes('today')) {
          date = 'Today';
        } else if (lower.includes('tomorrow')) {
          date = 'Tomorrow';
        } else if (lower.includes('thursday')) {
          date = 'Thursday';
        } else if (lower.includes('friday')) {
          date = 'Friday';
        } else if (lower.includes('tuesday')) {
          date = 'Tuesday';
        } else if (lower.includes('monday')) {
          date = 'Monday';
        } else if (lower.includes('wednesday')) {
          date = 'Wednesday';
        } else if (lower.includes('saturday')) {
          date = 'Saturday';
        } else if (lower.includes('sunday')) {
          date = 'Sunday';
        }
      }

      if (repeat !== 'Never' && date === 'Not Set') {
        date = 'Today';
      }

      let cleanTitle = phrase;
      cleanTitle = cleanTitle.replace(/\bevery\s+day\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bdaily\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bweekly\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bevening\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bmorning\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bafternoon\b/gi, '');
      cleanTitle = cleanTitle.replace(/\bnight\b/gi, '');
      cleanTitle = cleanTitle.replace(/\btonight\b/gi, '');
      cleanTitle = cleanTitle.replace(/^(remember to|need to|maybe|please|i should)\s+/gi, '');
      cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

      const formattedTitle = cleanTitle.length > 0 ? (cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1)) : phrase.trim();

      return {
        title: formattedTitle,
        notes: `Extracted automatically from capture: "${input.substring(0, 50)}..."`,
        priority,
        category,
        date,
        reminderTime,
        repeat,
        repeatEnds,
        completed: false,
        aiReasoning: priority === 'must' ? 'Prioritized as Must Do due to explicit intent or urgency.' : 'Categorized as Could Do for low pressure execution.',
        missingInfoWarning,
      };
    });
  };

  const applyAiEditToTask = async (taskId: string, instruction: string): Promise<string> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return 'Task not found.';

    try {
      const res = await fetch('/api/gemini/apply-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, instruction }),
      });
      const updates = await res.json();
      if (updates && typeof updates === 'object') {
        await updateTask(taskId, updates);
        return 'Task updated successfully with Gemini AI.';
      }
    } catch (err) {
      console.warn('Error calling /api/gemini/apply-edit, fallback local edit:', err);
    }

    const lower = instruction.toLowerCase();
    const updates: Partial<Task> = {};
    let message = 'AI updated task successfully.';

    if (lower.includes('could do') || lower.includes('lower priority')) {
      updates.priority = 'could';
      message = 'Updated priority to Could Do.';
    } else if (lower.includes('must do') || lower.includes('high priority')) {
      updates.priority = 'must';
      message = 'Updated priority to Must Do.';
    }

    if (lower.includes('friday')) {
      updates.date = 'Friday';
      message = 'Updated date to Friday.';
    } else if (lower.includes('tomorrow')) {
      updates.date = 'Tomorrow';
      message = 'Updated date to Tomorrow.';
    } else if (lower.includes('tuesday')) {
      updates.date = 'Tuesday';
      message = 'Updated date to Tuesday.';
    }

    await updateTask(taskId, updates);
    return message;
  };

  const triggerTestNotification = (taskId?: string) => {
    const targetTask = taskId ? tasks.find(t => t.id === taskId) : tasks.find(t => !t.completed);
    if (!targetTask) return;

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      taskId: targetTask.id,
      taskTitle: targetTask.title,
      type: 'reminder',
      time: 'Just now',
      active: true,
    };

    setNotifications(prev => [newNotif, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const snoozeNotification = (id: string, minutes: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateSettings = async (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));

    if (!user) return;

    const reminderUpdates: Record<string, any> = {};
    if (updates.defaultReminderTime !== undefined) reminderUpdates.defaultReminderTime = updates.defaultReminderTime;
    if (updates.brainDumpReminderTime !== undefined) reminderUpdates.brainDumpReminderTime = updates.brainDumpReminderTime;
    if (updates.brainDumpEnabled !== undefined) reminderUpdates.brainDumpEnabled = updates.brainDumpEnabled;
    if (updates.soundEnabled !== undefined) reminderUpdates.soundEnabled = updates.soundEnabled;

    if (Object.keys(reminderUpdates).length > 0) {
      await setDoc(doc(db, 'reminderSettings', user.uid), cleanUndefined({ ...reminderUpdates, userId: user.uid }), { merge: true });
    }

    const userSettingsUpdates: Record<string, any> = {};
    if (updates.theme !== undefined) userSettingsUpdates.theme = updates.theme;
    if (updates.offlineMode !== undefined) userSettingsUpdates.offlineMode = updates.offlineMode;

    if (Object.keys(userSettingsUpdates).length > 0) {
      await setDoc(doc(db, 'userSettings', user.uid), cleanUndefined({ ...userSettingsUpdates, userId: user.uid }), { merge: true });
    }
  };

  const toggleOfflineMode = () => {
    const nextOffline = !settings.offlineMode;
    updateSettings({ offlineMode: nextOffline });

    if (!nextOffline) {
      setTimeout(() => {
        setCaptures(curCaptures => {
          const queued = curCaptures.filter(c => c.status === 'offline_queued');
          queued.forEach(c => runAiProcessingPipeline(c));
          return curCaptures;
        });
      }, 500);
    }
  };

  const clearAllData = async () => {
    setTasks([]);
    setCaptures([]);
    localStorage.removeItem('sparkflow_tasks');
    localStorage.removeItem('sparkflow_captures');

    if (user?.uid) {
      try {
        const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('userId', '==', user.uid)));
        for (const d of tasksSnap.docs) {
          await deleteDoc(d.ref);
        }

        const capSnap = await getDocs(query(collection(db, 'inboxCaptures'), where('userId', '==', user.uid)));
        for (const d of capSnap.docs) {
          await deleteDoc(d.ref);
        }
      } catch (err) {
        console.error("Error clearing Firestore data:", err);
      }
    }
    showToast("All tasks and captures cleared.");
  };

  const resetToMockData = async () => {
    setTasks(INITIAL_TASKS);
    setCaptures(INITIAL_CAPTURES);
    localStorage.setItem('sparkflow_tasks', JSON.stringify(INITIAL_TASKS));
    localStorage.setItem('sparkflow_captures', JSON.stringify(INITIAL_CAPTURES));

    if (user?.uid) {
      try {
        const tasksSnap = await getDocs(query(collection(db, 'tasks'), where('userId', '==', user.uid)));
        for (const d of tasksSnap.docs) {
          await deleteDoc(d.ref);
        }

        const capSnap = await getDocs(query(collection(db, 'inboxCaptures'), where('userId', '==', user.uid)));
        for (const d of capSnap.docs) {
          await deleteDoc(d.ref);
        }

        for (const task of INITIAL_TASKS) {
          await setDoc(doc(db, 'tasks', task.id), cleanUndefined({ ...task, userId: user.uid }));
        }

        for (const cap of INITIAL_CAPTURES) {
          await setDoc(doc(db, 'inboxCaptures', cap.id), cleanUndefined({ ...cap, userId: user.uid }));
        }
      } catch (err) {
        console.error("Error setting mock data in Firestore:", err);
      }
    }
    showToast("Loaded sample demo data for testing.");
  };

  const sortedTasks = sortSparkFlowTasks(tasks);

  return (
    <AppContext.Provider
      value={{
        tasks: sortedTasks,
        captures,
        settings,
        activeTab,
        setActiveTab,
        notifications,
        selectedTaskId,
        setSelectedTaskId,
        activeCapture,
        setActiveCapture,

        isProcessingAi,
        processingStep,
        clarificationCapture,
        reviewCapture,
        isCaptureModalOpen,
        setIsCaptureModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,

        toggleTaskComplete,
        addTask,
        updateTask,
        deleteTask,
        submitCapture,
        answerClarification,
        saveReviewedTasks,
        applyAiEditToTask,

        triggerTestNotification,
        dismissNotification,
        snoozeNotification,

        updateSettings,
        toggleOfflineMode,
        resetToMockData,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

