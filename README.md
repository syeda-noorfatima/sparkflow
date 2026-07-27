<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/0e6289e6-de9a-4a13-8d17-18f906e29262

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


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

📦 **GitHub repo:** https://github.com/syeda-noorfatima/sparkflow


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
- Every AI-organized result is shown on a **Review screen** before it's saved — nothing is committed silently.
- Users can edit title, notes, category, deadline, priority, or delete the task entirely.
- Existing tasks can also be edited conversationally (e.g. "Change the reminder to Friday at 5 PM" or "Move this to Could Do").

### Dashboard
- **AI Overview** — a short plain-language summary of what's on the plate and what matters most right now.
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
6. Generates a one-line **AI Overview** summarizing what's most urgent and why.
7. Returns everything to the Review screen — nothing is saved without the user seeing it first.

**Model / provider used:** [ADD — e.g. "Google Gemini 1.5 Flash (free tier) via the Gemini API"]

**System prompt / instructions behind it** (adapt to what you actually used in code):

```
You are the task-extraction engine for SparkFlow, a productivity app for users
with ADHD and executive functioning challenges.

Your job: read the user's raw, unstructured capture (typed or transcribed speech)
and convert it into structured tasks.

Rules you must always follow:
1. Extract every distinct task mentioned. A single input may contain multiple tasks.
2. For each task, identify (if present): title, deadline, reminder time, notes, category.
3. Assign each task to "Must Do" or "Could Do" based on urgency and stated importance.
4. NEVER invent a deadline, reminder, priority, or detail that isn't stated or clearly
   implied. If information is essential but ambiguous or missing, do not guess —
   flag it and ask exactly one short, specific clarification question.
5. If no actionable task can be found in the input, return no task and say so plainly
   (e.g. "No actionable task was detected") rather than forcing one.
6. Keep tone calm, brief, and non-judgmental. Never add pressure or urgency language
   beyond what the user's own words imply.
7. Output must be structured (JSON) so the app can render it directly onto the
   Review screen for the user to confirm, edit, or delete before saving.

Return your response as JSON in this shape:
{
  "tasks": [
    {
      "title": string,
      "category": "Must Do" | "Could Do",
      "deadline": string | null,
      "reminder": string | null,
      "notes": string | null
    }
  ],
  "clarification_needed": string | null,
  "overview": string
}
```

> Replace the block above with your actual system prompt if it differs — this is reconstructed from your PRD's functional requirements (FR-1 through FR-4).

---

## e. Tools, services, and models used

| Category | Tool / Service |
|---|---|
| AI model | [e.g. Google Gemini API — free tier] |
| Backend / database | [e.g. Firebase (Firestore + Auth + Security Rules)] |
| Frontend framework | [e.g. React / Next.js / React Native] |
| Hosting / deployment | [e.g. Vercel] |
| Voice-to-text | [e.g. Web Speech API / device native STT] |
| Version control | GitHub (public repository) |
| Other | [e.g. Tailwind CSS, shadcn/ui, etc.] |

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
- [Node.js version — e.g. v18+]
- [Package manager — npm / yarn / pnpm]
- A free API key for [Gemini / your AI provider]
- A Firebase project (or your chosen backend) set up

### Setup

```bash
# 1. Clone the repo
git clone [YOUR REPO URL]
cd sparkflow

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file in the root directory:
```

```env
GEMINI_API_KEY=your_api_key_here
FIREBASE_API_KEY=your_firebase_key_here
FIREBASE_PROJECT_ID=your_project_id_here
# add any other keys your app needs
```

```bash
# 4. Run the app locally
npm run dev
```

The app will be available at `http://localhost:3000` (or your framework's default port).

> ⚠️ Never commit your `.env` file or API keys. Make sure `.env.local` is in your `.gitignore`, and set the same environment variables in your hosting provider's dashboard (e.g. Vercel → Project → Settings → Environment Variables) for the deployed version to work.

### Deployment
This project is deployed on [Vercel / your host] at: [LIVE URL]

To redeploy your own copy:
1. Fork/clone this repo.
2. Connect it to [Vercel/your host].
3. Add the environment variables listed above in the hosting dashboard.
4. Deploy.

---

## Product principles (for context)

SparkFlow's design follows a few non-negotiable rules that shaped every feature decision:

1. **Capture first** — record now, organize later.
2. **AI performs the executive function** — the user shouldn't have to manually categorize, prioritize, or schedule.
3. **Never assume** — AI never invents deadlines, priorities, or details; it asks one concise question when something essential is missing.
4. **User always has control** — every AI decision is editable before and after saving.
5. **Reduce cognitive load** — every interaction should remove a decision, not add one.
6. **Calm before productivity** — the app should make users feel in control, not pressured.

---

## Project status

MVP scope includes: text + voice capture, AI extraction & prioritization, Must Do / Could Do sorting, reminders, calendar (month/week), dashboard, task editing, notifications, and offline capture.

Explicitly out of scope for this version: Google Calendar/Gmail sync, OCR/PDF parsing, collaboration features, AI chat, habit tracking, gamification, and automatic multi-day scheduling.