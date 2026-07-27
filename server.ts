import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Status API to check Gemini API Key connectivity
app.get('/api/gemini/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    res.json({ connected: true, model: 'gemini-3.6-flash' });
  } else {
    res.json({ connected: false, message: 'GEMINI_API_KEY is not configured in server environment.' });
  }
});

// 1. Process Capture API (Executive Function Engine)
app.post('/api/gemini/process-capture', async (req, res) => {
  const { rawText, currentDateStr, currentTasks } = req.body;
  try {
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      res.status(400).json({ error: 'rawText is required' });
      return;
    }

    const ai = getGeminiClient();

    if (!ai) {
      console.warn('GEMINI_API_KEY missing, using fallback rule parser');
      const fallbackData = fallbackRuleParser(rawText);
      console.log('EXECUTIVE ENGINE: FALLBACK');
      res.json(fallbackData);
      return;
    }

    const tasksContext = Array.isArray(currentTasks)
      ? currentTasks.map((t: any) => `[ID: ${t.id}] Title: "${t.title}", Priority: ${t.priority}, Date: ${t.date || 'Not Set'}, ReminderTime: ${t.reminderTime || 'Not Set'}, Repeat: ${t.repeat || 'Never'}, RepeatEnds: ${t.repeatEnds || 'Never'}`).join('\n')
      : '';

    const systemInstruction = `
You are SparkFlow's AI Executive Function Assistant. SparkFlow is an ADHD-first task management application.
Users do NOT think in terms of "deadlines" ("When is it due?"). Instead, they think: "When do I need to do this?"

CRITICAL TITLE CLEANING & EXTRACTION RULES:
- The task "title" MUST contain ONLY the core actionable task itself.
- REMOVE all date, time, relative day/time, reminder, frequency/recurrence, and duration phrases from "title".
  - Examples of phrases to remove from "title": "tomorrow", "tomorrow morning", "today", "yesterday", "tonight", "this morning", "this evening", "this afternoon", "next week", "next Wednesday", "next Tuesday", "by Friday", "before August 10", "on Monday", "before August 20", "at 8 AM", "at 3 PM", "before 11:59 PM", "every day", "daily", "weekly", "for 30 days", "for 10 days", "in the morning", etc.
  - Store those removed scheduling elements strictly inside their respective fields (date, reminderTime, repeat, repeatEnds).
- Preserve important descriptive information that is part of the task itself (e.g. subject or item names like "HCI assignment", "Vitamin D", "scholarship office", "psychology assignment").
- Clean up any leftover leading/trailing prepositions or punctuation from "title" (such as "by", "before", "at", "on", "for", etc.).
- Ensure "title" starts with a capital letter.
- DO NOT split task titles simply because they contain the word "and". Book titles, course names, project names, subject names, organization names, and proper nouns containing "and" MUST remain a single unified task (e.g., "Read Crime and Punishment every Sunday evening" -> Title: "Read Crime and Punishment").

CRITICAL SCHEDULING FIELDS & RULES:

1. Date:
   - Represents the day on which the task should happen (e.g. "Tomorrow", "Tuesday", "Friday", "Next Wednesday", "Next Tuesday", "This Week", "Next Week", "Next Month", "August 10", "August 20", "Today").
   - Populated directly from natural language expressions of date, including relative terms or prepositions.
   - Example: "before August 10" or "by August 10" -> Date = "August 10".
   - Example: "by Friday" or "before Friday" -> Date = "Friday".
   - Example: "next Wednesday" -> Date = "Next Wednesday".
   - Example: "next Tuesday at 3 PM" -> Date = "Next Tuesday", Reminder Time = "3:00 PM".
   - Example: "tomorrow morning" -> Date = "Tomorrow", Reminder Time = "9:00 AM".
   - Example: "today before 11:59 PM" -> Date = "Today", Reminder Time = "11:59 PM".
   - If user NEVER mentioned a date or relative timeframe, set Date to "Not Set". NEVER invent dates if the user never mentioned one!

CAPTURE AND FORGET PHILOSOPHY:
- SparkFlow follows a "Capture and Forget" philosophy. Processing a capture MUST NEVER interrupt the user with follow-up questions or clarification questions.
- ALWAYS set "needsClarification" to false. NEVER set "needsClarification" to true.
- ALWAYS extract and create tasks immediately using the best reasonable interpretation for vague scheduling phrases:
  - "sometime next month" -> Date = "Next Month"
  - "later this week" -> Date = "This Week"
  - "sometime next week" -> Date = "Next Week"
  - "tomorrow morning" -> Date = "Tomorrow", Reminder Time = "9:00 AM"
  - "before August 10" -> Date = "August 10"
  - "someday" -> Priority = "could", Date = "Not Set"
  - "dentist appointment" -> Title = "Dentist appointment", Date = "Not Set"

2. Reminder Time:
   - Represents what time SparkFlow should remind the user.
   - If user explicitly gives a time ("at 3 PM", "before 11:59 PM", "at 8 AM", "3:00 PM") -> Reminder Time = "3:00 PM" / "11:59 PM" / "8:00 AM".
   - Convert explicit times to standard 12-hour format with AM/PM (e.g., "at 3 PM" -> "3:00 PM", "before 11:59 PM" -> "11:59 PM", "at 8 AM" -> "8:00 AM").
   - If user specifies a natural time period instead of an exact time:
     - Morning → "9:00 AM"
     - Afternoon → "2:00 PM"
     - Evening → "6:00 PM"
     - Night → "9:00 PM"
   - If user provides NO time information at all, set Reminder Time to "Not Set". NEVER invent reminder times!

3. Repeat:
   - Used only for recurring tasks.
   - Supported values: "Never", "Daily", "Weekly", "Monthly", "Every Monday", "Every Tuesday", "Every Wednesday", "Every Thursday", "Every Friday", "Every Saturday", "Every Sunday", "Custom".
   - Example: "Take medicine every day" or "every day for 30 days at 8 AM" -> Repeat = "Daily".
   - Example: "Gym every Monday" -> Repeat = "Weekly".
   - Example: "Read book every Sunday" -> Repeat = "Weekly".
   - WEEKDAY RECURRENCE RULE: Any phrase matching "every <weekday>" (every Monday, every Tuesday, every Wednesday, every Thursday, every Friday, every Saturday, every Sunday) MUST be classified as recurring with Repeat = "Weekly" (or "Every <Weekday>") and Repeat Ends = "Never" (unless specified). Do NOT place the weekday into the one-time "date" field.

4. Repeat Ends:
   - Defines when a recurring task should stop.
   - Supported values: "Never", "Specific Date", "After X Days", "After X Occurrences" (e.g. "After 30 Days", "After 20 Days", "After 10 Days", "August 15").
   - Example: "Take Vitamin D every day at 8 AM for 30 days" -> Repeat = "Daily", Repeat Ends = "After 30 Days", Reminder Time = "8:00 AM".
   - Example: "Take one Bisleri tablet every day for 10 days" -> Repeat = "Daily", Repeat Ends = "After 10 Days".

EXAMPLES OF EXTRACTED TASKS:

Example 1:
Input: "Tomorrow morning call the scholarship office"
Output:
title: "Call the scholarship office"
priority: "must"
category: "School"
date: "Tomorrow"
reminderTime: "9:00 AM"
repeat: "Never"
repeatEnds: "Never"

Example 2:
Input: "Take Vitamin D every day at 8 AM for 30 days"
Output:
title: "Take Vitamin D"
priority: "must"
category: "Health"
date: "Today"
reminderTime: "8:00 AM"
repeat: "Daily"
repeatEnds: "After 30 Days"

Example 3:
Input: "Submit HCI assignment today before 11:59 PM"
Output:
title: "Submit HCI assignment"
priority: "must"
category: "School"
date: "Today"
reminderTime: "11:59 PM"
repeat: "Never"
repeatEnds: "Never"

Example 4:
Input: "Read book every Sunday"
Output:
title: "Read book"
priority: "must"
category: "Personal"
date: "Today"
reminderTime: "Not Set"
repeat: "Weekly"
repeatEnds: "Never"

Example 5:
Input: "Read Crime and Punishment every Sunday evening"
Output:
title: "Read Crime and Punishment"
priority: "must"
category: "Personal"
date: "Today"
reminderTime: "6:00 PM"
repeat: "Weekly"
repeatEnds: "Never"

MULTIPLE TASK EXTRACTION & TASK SPLITTING RULES:
- When a user enters a brain dump paragraph containing multiple independent actions, EXTRACT EVERY ACTION ITEM AS A SEPARATE OBJECT inside "extractedTasks".
- Separate tasks into "must" (Must Do) and "could" (Could Do).
- DO NOT split task titles simply because they contain the word "and".
- Split on "and" ONLY when "and" clearly joins two independent actions (e.g., "Buy groceries and call Mom" -> Task 1: "Buy groceries", Task 2: "Call Mom").
- Book titles, course names, project names, subject names, organization names, and proper nouns containing "and" MUST remain a single unified task (e.g., "Read Crime and Punishment every Sunday evening" -> Title: "Read Crime and Punishment").

Return structured JSON conforming strictly to the response schema.
`;

    console.log('Calling Gemini...');
    console.log('Raw user input:', rawText);

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: rawText,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isEmotionalOnly: { type: Type.BOOLEAN },
            emotionalMessage: { type: Type.STRING },
            needsClarification: { type: Type.BOOLEAN },
            clarificationQuestion: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
            },
            extractedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  category: { type: Type.STRING },
                  date: { type: Type.STRING },
                  reminderTime: { type: Type.STRING },
                  repeat: { type: Type.STRING },
                  repeatEnds: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  isExistingTaskUpdate: { type: Type.BOOLEAN },
                  existingTaskIdToUpdate: { type: Type.STRING },
                },
                required: ['title', 'priority', 'date', 'reminderTime', 'repeat', 'repeatEnds'],
              },
            },
          },
          required: ['isEmotionalOnly', 'needsClarification', 'extractedTasks'],
        },
      },
    });

    const jsonText = response.text?.trim() || '{}';
    console.log('Raw Gemini JSON response:', jsonText);
    console.log('Fallback logic used:', false);

    const parsedData = JSON.parse(jsonText);
    console.log('EXECUTIVE ENGINE: GEMINI');
    res.json(parsedData);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn('Gemini API call failed, using fallback rule parser:', errMsg);
    const fallbackData = fallbackRuleParser(rawText);
    console.log('EXECUTIVE ENGINE: FALLBACK');
    res.json(fallbackData);
  }
});

// 2. AI Task Edit Assistant
app.post('/api/gemini/apply-edit', async (req, res) => {
  const { task, instruction } = req.body;
  try {
    const ai = getGeminiClient();

    if (!task || !instruction) {
      res.status(400).json({ error: 'Missing task or instruction' });
      return;
    }

    if (!ai) {
      const lowerInst = (instruction || '').toLowerCase();
      const updates: any = {};
      if (lowerInst.includes('tuesday')) updates.date = 'Tuesday';
      else if (lowerInst.includes('tomorrow')) updates.date = 'Tomorrow';
      else if (lowerInst.includes('friday')) updates.date = 'Friday';
      if (lowerInst.includes('9:00 am') || lowerInst.includes('morning')) updates.reminderTime = '9:00 AM';
      else if (lowerInst.includes('6:00 pm') || lowerInst.includes('evening')) updates.reminderTime = '6:00 PM';
      res.json(updates);
      return;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Task: ${JSON.stringify(task)}\nUser Instruction: "${instruction}"`,
      config: {
        systemInstruction: 'Update the task object based on the user instruction. Return the modified properties as JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            priority: { type: Type.STRING },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
            reminderTime: { type: Type.STRING },
            repeat: { type: Type.STRING },
            repeatEnds: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
        },
      },
    });

    const jsonText = response.text?.trim() || '{}';
    res.json(JSON.parse(jsonText));
  } catch (err: any) {
    console.warn('Gemini API edit fallback executed:', err?.message || err);
    const lowerInst = (instruction || '').toLowerCase();
    const updates: any = {};
    if (lowerInst.includes('tuesday')) updates.date = 'Tuesday';
    else if (lowerInst.includes('tomorrow')) updates.date = 'Tomorrow';
    else if (lowerInst.includes('friday')) updates.date = 'Friday';
    if (lowerInst.includes('9:00 am') || lowerInst.includes('morning')) updates.reminderTime = '9:00 AM';
    else if (lowerInst.includes('6:00 pm') || lowerInst.includes('evening')) updates.reminderTime = '6:00 PM';
    if (Object.keys(updates).length > 0) {
      res.json(updates);
    } else {
      res.json({ notes: instruction });
    }
  }
});

function cleanTaskTitle(rawClause: string): string {
  let clean = rawClause;

  // 1. Remove duration phrases e.g. "for 30 days", "for 10 days"
  clean = clean.replace(/\bfor\s+\d+\s+days\b/gi, '');

  // 2. Remove recurrence terms
  clean = clean.replace(/\bevery\s+day\b/gi, '');
  clean = clean.replace(/\bdaily\b/gi, '');
  clean = clean.replace(/\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  clean = clean.replace(/\bweekly\b/gi, '');

  // 3. Remove vague time phrases
  clean = clean.replace(/\bsometime\s+(next\s+month|next\s+week|later)\b/gi, '');
  clean = clean.replace(/\blater\s+this\s+week\b/gi, '');
  clean = clean.replace(/\bsomeday\b/gi, '');
  clean = clean.replace(/\bnext\s+month\b/gi, '');
  clean = clean.replace(/\bthis\s+week\b/gi, '');
  clean = clean.replace(/\bnext\s+week\b/gi, '');

  // 4. Remove relative times
  clean = clean.replace(/\btomorrow\s+morning\b/gi, '');
  clean = clean.replace(/\bthis\s+morning\b/gi, '');
  clean = clean.replace(/\bin\s+the\s+morning\b/gi, '');
  clean = clean.replace(/\bmorning\b/gi, '');
  clean = clean.replace(/\bthis\s+afternoon\b/gi, '');
  clean = clean.replace(/\bin\s+the\s+afternoon\b/gi, '');
  clean = clean.replace(/\bafternoon\b/gi, '');
  clean = clean.replace(/\bthis\s+evening\b/gi, '');
  clean = clean.replace(/\bin\s+the\s+evening\b/gi, '');
  clean = clean.replace(/\bevening\b/gi, '');
  clean = clean.replace(/\btonight\b/gi, '');
  clean = clean.replace(/\bnight\b/gi, '');

  // 5. Remove explicit time expressions like "at 8 AM", "before 11:59 PM", "by 3:00 PM", "8 AM", "11:59 PM"
  clean = clean.replace(/\b(?:at|before|by)?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '');

  // 6. Remove dates, next <day>, relative days
  clean = clean.replace(/\b(today|tomorrow|yesterday)\b/gi, '');
  clean = clean.replace(/\b(?:by|on|before)?\s*(next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '');
  clean = clean.replace(/\b(?:by|on|before)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi, '');

  // 7. Remove common prompt prefixes
  clean = clean.replace(/^(I need to|Need to|Remember to|Please|I should)\s+/gi, '');

  // 8. Clean up leading/trailing prepositions and leftover punctuation
  clean = clean.replace(/^(?:by|before|at|on|for)\s+/gi, '');
  clean = clean.replace(/\s+(?:by|before|at|on|for)$/gi, '');
  clean = clean.replace(/\s+/g, ' ').trim();

  // 9. Capitalize first letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean || rawClause.trim();
}

// Smart task clause splitter that preserves book titles, proper nouns, and course names containing "and"
function splitIntoTaskClauses(rawText: string): string[] {
  const lines = rawText.split(/(?:\n|\.|;)+/).map(s => s.trim()).filter(s => s.length > 0);
  const clauses: string[] = [];

  // Common action verbs/phrases that indicate a new independent task when following "and"
  const actionVerbPattern = /^(?:then\s+|also\s+|please\s+|remember\s+to\s+|need\s+to\s+|i\s+should\s+|maybe\s+)?(?:call|buy|pay|submit|pick|send|clean|do|finish|write|check|email|meet|schedule|take|walk|go|review|study|prep|prepare|read|order|post|make|book|cancel|contact|update|setup|set|organize|file|deposit|print|type|fix|work|ask|tell|get|talk|text|reply|listen|watch|cook|wash|feed|exercise|run|swim|open|close|start|stop|complete|create|draft|edit|upload|download|renew|register|apply|attend)\b/i;

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
            clauses.push(currentClause.trim());
          }
          currentClause = '';
        } else {
          // Keep "and" inside title e.g. "Crime and Punishment"
          currentClause += part;
        }
      } else {
        currentClause += part;
      }
    }
    if (currentClause.trim().length > 2) {
      clauses.push(currentClause.trim());
    }
  }

  return clauses.length > 0 ? clauses : [rawText.trim()];
}

// Fallback rule parser when API key is not present or offline
function fallbackRuleParser(rawText: string) {
  const lower = rawText.toLowerCase();

  // Emotional detection
  const purelyEmotional = (lower.includes('overwhelmed') || lower.includes('stressed') || lower.includes('sad') || lower.includes('anxious')) &&
    !lower.includes('assignment') && !lower.includes('call') && !lower.includes('buy') && !lower.includes('due') && !lower.includes('pay') && !lower.includes('email');

  if (purelyEmotional) {
    return {
      isEmotionalOnly: true,
      emotionalMessage: 'No actionable task detected.',
      needsClarification: false,
      extractedTasks: [],
    };
  }

  // Smart task splitter
  const rawClauses = splitIntoTaskClauses(rawText);
  const tasks = rawClauses.map(s => {
    const sLower = s.toLowerCase();
    const priority = (sLower.includes('maybe') || sLower.includes('could') || sLower.includes('photoshop') || sLower.includes('try') || sLower.includes('someday')) ? 'could' : 'must';
    let category = 'Personal';
    if (sLower.includes('psychology') || sLower.includes('assignment') || sLower.includes('scholarship') || sLower.includes('office') || sLower.includes('hci')) category = 'School';
    else if (sLower.includes('vitamin') || sLower.includes('medication') || sLower.includes('pill') || sLower.includes('prescription')) category = 'Health';
    else if (sLower.includes('milk') || sLower.includes('buy') || sLower.includes('groceries')) category = 'Errands';
    else if (sLower.includes('tuition') || sLower.includes('pay') || sLower.includes('bill')) category = 'Finance';

    let date = 'Not Set';
    const monthDayMatch = sLower.match(/(?:before|by|on)?\s*\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i);
    const nextDayMatch = sLower.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
    const dayMatch = sLower.match(/(?:by|before|on)?\s*\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
    const everyWeekdayMatch = sLower.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);

    if (sLower.includes('sometime next month') || sLower.includes('next month')) {
      date = 'Next Month';
    } else if (sLower.includes('later this week') || sLower.includes('this week')) {
      date = 'This Week';
    } else if (sLower.includes('sometime next week') || sLower.includes('next week')) {
      date = 'Next Week';
    } else if (sLower.includes('someday')) {
      date = 'Not Set';
    } else if (monthDayMatch) {
      const monthStr = monthDayMatch[1].charAt(0).toUpperCase() + monthDayMatch[1].slice(1);
      date = `${monthStr} ${monthDayMatch[2]}`;
    } else if (nextDayMatch) {
      const dayStr = nextDayMatch[1].charAt(0).toUpperCase() + nextDayMatch[1].slice(1);
      date = `Next ${dayStr}`;
    } else if (dayMatch && !everyWeekdayMatch) {
      const dayStr = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1);
      date = dayStr;
    } else if (sLower.includes('tomorrow')) {
      date = 'Tomorrow';
    } else if (sLower.includes('today')) {
      date = 'Today';
    }

    let reminderTime = 'Not Set';
    const timeMatch = sLower.match(/(?:at|before|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] || '00';
      const ampm = timeMatch[3].toUpperCase();
      reminderTime = `${h}:${m} ${ampm}`;
    } else if (sLower.includes('morning')) reminderTime = '9:00 AM';
    else if (sLower.includes('afternoon')) reminderTime = '2:00 PM';
    else if (sLower.includes('evening') || sLower.includes('night')) reminderTime = '6:00 PM';

    let repeat = 'Never';
    if (sLower.includes('every day') || sLower.includes('daily')) repeat = 'Daily';
    else if (everyWeekdayMatch || sLower.includes('weekly')) repeat = 'Weekly';

    let repeatEnds = 'Never';
    const daysMatch = sLower.match(/for\s+(\d+)\s+days/i);
    if (daysMatch) {
      repeatEnds = `After ${daysMatch[1]} Days`;
    } else if (sLower.includes('for 10 days')) {
      repeatEnds = 'After 10 Days';
    }

    if (repeat !== 'Never' && date === 'Not Set') {
      date = 'Today';
    }

    const title = cleanTaskTitle(s);

    return {
      title,
      priority,
      category,
      date,
      reminderTime,
      repeat,
      repeatEnds,
      notes: '',
      isExistingTaskUpdate: false,
      existingTaskIdToUpdate: '',
    };
  });

  return {
    isEmotionalOnly: false,
    needsClarification: false,
    extractedTasks: tasks,
  };
}

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SparkFlow Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
