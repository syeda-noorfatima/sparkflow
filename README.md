# SparkFlow

**AI-powered executive functioning assistant — turn messy thoughts into organized, actionable tasks.**


---

## a. What it is & the problem it solves

**SparkFlow** is a productivity app built for people whose brains don't work well with traditional to-do apps — most directly, people with **ADHD**, but really anyone who struggles with organizing, prioritizing, or remembering responsibilities.

Most productivity apps assume you already know how to plan: what category a task belongs in, how urgent it is, when to be reminded. For a lot of people — especially with ADHD — that upfront planning work is exactly what makes the task un-doable. The result is a familiar cycle: important things get forgotten, responsibilities pile up and feel overwhelming, and the planning app itself gets abandoned.

SparkFlow flips the order of operations. **You capture first** — by typing or speaking whatever's in your head, in whatever order it comes out — and **AI does the executive functioning work**: extracting the actual tasks, detecting deadlines and reminders, categorizing, and prioritizing. You review the result and stay in full control, but you never have to build the plan from a blank page yourself.

**Who it's for:** university students with ADHD, adults with ADHD, and anyone managing multiple responsibilities who finds "just organize your tasks" easier said than done.

---

## b. Live demo

🔗 **Live app:** https://sparkflow-fkmqc62hx-syeda-noor-fatima.vercel.app/

---

## c. Features

### Capture
- **Text capture** — type anything, naturally, with no required formatting (e.g. "Psychology assignment due Thursday").
- **Voice capture** — record a message; pause, stop, continue, or discard before sending.
- **Offline capture** — captures made without internet are saved locally into the Inbox and processed automatically once connection returns.

### AI Processing
- Automatically extracts individual tasks from unstructured input (including multiple tasks from a single capture).
- Detects deadlines, reminders, and relevant notes.
- Categorizes and prioritizes tasks into **Must Do** vs **Could Do**.
- Asks a single, concise clarification question when — and only when — essential information is genuinely missing (e.g. "Which Friday do you mean?"). It never invents dates, priorities, or details.

### Review & Editing
- Users can edit title, notes, category, deadline, priority, or delete the task entirely.
- Existing tasks can also be edited conversationally (e.g. "Change the reminder to Friday at 5 PM" or "Move this to Could Do").

### Dashboard
- **Next Priority** — task that matters most right now to prevent ADHD paralysis that is caused by too many options.
- **Must Do** / **Could Do** lists, AI-ordered but manually reorderable.
- **Completed** tasks, collapsed by default so they don't clutter the view.

### Calendar
- **Month view** — tasks shown directly on their dates.
- **Week view** — seven scannable day cards (no hourly timeline) for quick "what's this week" glances.

### Notifications & Reminders
- Reminders support **Complete / Snooze / Dismiss**.
- Snooze options: 15 min, 30 min, 1 hour, 3 hours, tomorrow.
- Dismissed reminders don't repeat; snoozed reminders fire once more at the chosen time.

### Inbox
- Tracks captures through their lifecycle: Processing → Needs Clarification / Failed / Completed.
- Failed AI processing is retried automatically without losing the original capture.

### Settings
- Default reminder time
- Light / Dark theme
- Brain dump reminder notifications
- Notification frequency

---

## d. The AI feature

The core AI feature is **automatic task extraction, prioritization, and organization from unstructured natural-language input** (text or transcribed voice).

**What it does, step by step:**
1. Takes the user's raw capture (e.g. *"Psychology assignment due Thursday. Maybe learn Photoshop. Call Mom Friday."*)
2. Splits it into individual, discrete tasks.
3. Extracts, per task: deadline, reminder time, notes, category, and priority.
4. Sorts tasks into **Must Do** vs **Could Do**.
5. If something essential is missing and can't be safely inferred (e.g. an ambiguous "Friday"), it asks **one** short clarification question instead of guessing.
6. Generates **Next Priority** card highlighting task that is most urgent.
7. Everything gets saved.

**Model / provider used:** [ADD — e.g. "Google Gemini 1.5 Flash (free tier) via the Gemini API"]

**System prompt / instructions behind it** 

```
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
```

---

## e. Tools, services, and models used

| Category | Tool / Service |
|---|---|
| AI model | [Gemini 3.6 Flash — free tier] |
| Backend / database | [Firebase (Firestore + Auth + Security Rules)] |
| Frontend framework | [Built via Google AI Studio] |
| Hosting / deployment | [Vercel] |
| Voice-to-text | [Browser's built-in Web Speech API ] |
| Version control | GitHub (public repository) |

---

## f. Screenshots

![](./assets/screenshots/image%20(10).png)
![](./assets/screenshots/image%20(11).png)
![](./assets/screenshots/image%20(12).png)
![](./assets/screenshots/image%20(13).png)
![](./assets/screenshots/image%20(14).png)
![](./assets/screenshots/image%20(15).png)
![](./assets/screenshots/image%20(16).png)

---

## g. How to run the project
 
### Prerequisites
- Node.js v18+ and npm
- A free Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))
- A Firebase project set up (Firestore enabled)
### Setup
 
```bash
# 1. Clone the repo
git clone [YOUR REPO URL]
cd sparkflow
 
# 2. Install dependencies
npm install
 
# 3. Set up environment variables
# Create a .env file in the root directory (see .env.example):
```
 
```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="your_app_url_here"
 
VITE_FIREBASE_API_KEY="your_firebase_api_key_here"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```
 
```bash
# 4. Run the app locally
npm run dev
```


### Deployment
This project is deployed on [Vercel] at: https://sparkflow-fkmqc62hx-syeda-noor-fatima.vercel.app/

To redeploy your own copy:
1. Fork/clone this repo.
2. Connect it to [Vercel].
3. Add the environment variables listed above in the hosting dashboard.
4. Deploy.

---

## Product principles (for context)

SparkFlow's design follows a few non-negotiable rules that shaped every feature decision:

1. **Capture first** — record now, organize later.
2. **AI performs the executive function** — the user shouldn't have to manually categorize, prioritize, or schedule.
3. **Never assume** — AI never invents deadlines, priorities, or details; it asks one concise question when something essential is missing.
4. **User always has control** — every AI decision is editable after saving.
5. **Reduce cognitive load** — every interaction should remove a decision, not add one.
6. **Calm before productivity** — the app should make users feel in control, not pressured.

---

## Project status

MVP scope includes: text + voice capture, AI extraction & prioritization, Must Do / Could Do sorting, reminders, calendar (month/week), dashboard, task editing, notifications, and offline capture.

Explicitly out of scope for this version: Google Calendar/Gmail sync, OCR/PDF parsing, collaboration features, AI chat, habit tracking, gamification, and automatic multi-day scheduling.