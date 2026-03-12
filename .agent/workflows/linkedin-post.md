---
description: Generate a LinkedIn post based on the Fastlytics codebase
---

# 🚀 Fastlytics LinkedIn Growth Protocol

**Objective:** Establish authority as a Full-Stack Engineer by leveraging the `Fastlytics` codebase to generate high-value, technical "Build in Public" content.
**Frequency:** 5-6 posts/week.
**Tone:** "No-BS" Developer. Technical, enthusiastic, specific. Avoid generic "I'm thrilled to announce" fluff. Focus on _problems solved_.

---

## 🧠 Part 1: The Persona & Voice

- **Role:** Final-year CS student & Full-Stack Engineer.
- **Key Themes:** React Performance, Data Visualization (D3/Recharts), Backend Efficiency (FastAPI), Real-time Systems, F1 Strategy.
- **Writing Style:**
  - **Hook:** Start with a problem or a bold technical statement.
  - **Body:** Short paragraphs. Use bullet points for stacks/steps.
  - **Takeaway:** A lesson learned or a question for the community.
  - **Hashtags:** #buildinpublic #react #typescript #f1 #softwareengineering

---

## 📅 Part 2: The Weekly Content Schedule (Prompting Guide)

_Use these templates to generate posts. The `[VARIABLE]` sections should be filled by analyzing the current state of the codebase._

### 🟢 Monday: The "Deep Tech" Build

**Goal:** Show specific engineering prowess.
**IDE Instruction:** _Scan `src/components` or `backend-api/` for complex logic or recent refactors._
**Template:**

> "The hardest part of building Fastlytics wasn't X, it was `[SPECIFIC_TECHNICAL_CHALLENGE]`.
>
> I initially tried `[OLD_APPROACH]`, but it caused `[PROBLEM: e.g., memory leaks, lag]`.
>
> So I refactored it using `[NEW_LIBRARY_OR_PATTERN]`.
>
> Code snippet below showing how I handled `[SPECIFIC_FUNCTION]`.
>
> Has anyone else run into this with `[TECH_STACK]`?
>
> #react #coding #optimization"

### 🔵 Tuesday: Global Tech/Industry News

**Goal:** Connect Fastlytics to broader trends (AI, Real-time data, Cloud).
**IDE Instruction:** _Relate a generic industry trend to a specific file in the repo._
**Template:**

> "Everyone is talking about `[CURRENT_TREND: e.g., AI Agents, Serverless]`.
>
> It made me rethink how I handle `[FEATURE: e.g., race predictions]` in Fastlytics. Currently, I'm using `[CURRENT_STACK]`, but I'm experimenting with `[NEW_TOOL]`.
>
> The goal? Reduce latency from `X`ms to `Y`ms.
>
> What's your take on `[TREND]` for production apps?
> #techtrends #software"

### 🟣 Wednesday: The "Why This Stack?" (Architecture)

**Goal:** Justify architectural choices to show seniority.
**IDE Instruction:** _Analyze `package.json` or `requirements.txt`._
**Template:**

> "Why I chose `[TECHNOLOGY: e.g., FastAPI]` over `[ALTERNATIVE: e.g., Node.js]` for the Fastlytics backend:
>
> 1. **Speed:** `[SPECIFIC_BENEFIT_FOUND_IN_CODE]`
> 2. **Ecosystem:** `[LIBRARY_USAGE: e.g., Pandas/FastF1]`
> 3. **DX:** Type hints in Python 3.10+ saved me hours of debugging `[DATA_STRUCTURE]`.
>
> Sometimes the 'boring' choice is the best choice.
> #backend #python #fastapi #architecture"

### 🟠 Thursday: The Visual/UI Showcase

**Goal:** Eye candy to stop the scroll.
**IDE Instruction:** _Describe a visual component (e.g., `TrackMap.tsx`, `TelemetryChart.tsx`)._
**Template:**

> "Visualizing data is easy. Making it _understandable_ is hard.
>
> Working on the `[COMPONENT_NAME]` today. The goal was to take raw telemetry data and make it readable for a casual fan.
>
> I used `[UI_LIBRARY: e.g., Recharts]` with a `[DESIGN_STYLE: Cyber-brutalist]` theme.
>
> `[INSERT SCREENSHOT/GIF]`
>
> Thoughts on the high-contrast aesthetic?
> #ui #design #frontend #dataviz"

### 🔴 Friday: "War Stories" (Bugs & Failures)

**Goal:** Relatability and humility.
**IDE Instruction:** _Look at recent `fix` commits or complex `TODO` comments._
**Template:**

> "Spent 4 hours debugging a `[ERROR_TYPE]` today.
>
> Turns out, the issue wasn't the API, it was `[STUPID_MISTAKE: e.g., a missing dependency array in useEffect]`.
>
> `[BRIEF_EXPLANATION_OF_FIX]`.
>
> Reminder: Always check your `[KEY_LESSON]`. 😅
> #debugging #devlife #failforward"

---

## 🔍 Part 3: Codebase Extraction Rules (For the IDE)

**When asked to "Write a LinkedIn post about X":**

1.  **If X = Performance:**
    - Look in: `src/components/Telemetry`, `src/hooks`, `vite.config.ts`.
    - Highlight: Memoization (`useMemo`, `useCallback`), rendering optimizations, bundle size reduction.

2.  **If X = Backend/Data:**
    - Look in: `backend-api/main.py`, `backend-api/processor.py`.
    - Highlight: Pydantic models, Caching strategies, Database queries (Supabase).

3.  **If X = UI/Design:**
    - Look in: `tailwind.config.js`, `src/components/ui`.
    - Highlight: Custom themes, animation libraries (Framer Motion), responsiveness.

4.  **If X = Workflow/Tools:**
    - Look in: `.github/workflows`, `eslint.config.js`, `docker-compose.yml`.
    - Highlight: CI/CD pipelines, linting rules, containerization.

---

## 💬 Part 4: Engagement & Reply Assistant

_Use this logic when the user provides a LinkedIn post to reply to._

**Trigger:** "Draft a reply to this post: [URL/TEXT]"

**Reply Modes:**

1.  **The "I Built This" Reply:**
    - _Context:_ Post discusses a problem you've solved (e.g., handling large datasets).
    - _Draft:_ "Spot on. I ran into this exact bottleneck with F1 telemetry data in Fastlytics. Solved it by [SOLUTION FROM CODEBASE]. The performance gain was massive."
2.  **The "Curious Dev" Reply:**
    - _Context:_ Post discusses a new tool/tech.
    - _Draft:_ "Interesting take. How do you find [TOOL] handles [EDGE_CASE]? I've been sticking to [YOUR_STACK] for stability, but this looks promising for [SPECIFIC_USE_CASE]."
3.  **The "Supportive Peer" Reply:**
    - _Context:_ Someone sharing a win/project.
    - _Draft:_ "Love the implementation of [FEATURE]. The UI looks super clean. Are you using [GUESS_LIBRARY] for that animation?"

---

## 🚀 How to Use This Workflow

Ask me to generate a LinkedIn post by specifying:

- **Day of the week** (Monday = Deep Tech, Thursday = Visual, etc.)
- **Topic focus** (Performance, Backend, UI, or let me scan recent changes)
- **Optional:** A specific component or feature to highlight

Example prompts:

- "Write a Monday LinkedIn post about the Track Dominance feature"
- "Generate a Thursday visual showcase post"
- "Write a Friday bug story based on recent commits"
