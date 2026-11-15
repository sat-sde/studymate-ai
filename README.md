# 📚 StudyMate AI

## 📑 Table of Contents

1. [Project Introduction](#-project-introduction)
2. [Features](#-features)
3. [Technology Stack](#-technology-stack)
4. [Project Folder Structure](#-project-folder-structure)
5. [Installation Instructions](#-installation-instructions)
6. [Environment Variable Configuration](#-environment-variable-configuration)
7. [Running the Application](#-running-the-application)
8. [How Gemini AI Integration Works](#-how-gemini-ai-integration-works)
9. [How Structured JSON is Validated](#-how-structured-json-is-validated)
10. [State Management Architecture](#-state-management-architecture)
11. [Error Handling & Reliability](#-error-handling--reliability)
12. [Testing & Verification](#-testing--verification)
13. [Known Limitations](#-known-limitations)
14. [AI Usage Disclosure](#-ai-usage-disclosure)
15. [Actual Time Spent](#-actual-time-spent)

---

## 🌟 Project Introduction

**StudyMate AI** is a frontend internship assignment designed to solve a core student challenge: converting long, unstructured lecture notes, textbooks, and study guides into active recall study tools.

Instead of displaying raw chatbot text, StudyMate AI extracts key concepts and renders them as:
- **A focused topic title**
- **A 5-card carousel with physical 3D card-flip animations**
- **A 5-question multiple-choice quiz** with immediate answer feedback, explanations, final score analytics, and a **Retry Wrong Answers** mode.

---

## ✨ Features

- **⚡ Instant Study Material Generation**: Paste any study notes (or use the one-click sample button) to generate study material in seconds.
- **📇 3D Flippable Flashcards**:
  - Displays one focused card at a time.
  - Smooth 3D card flip animation toggles between Question (front) and Answer (back).
  - Clean Prev/Next navigation with boundary protection (`1/5` to `5/5`).
  - Auto-resets to the question side whenever switching cards.
  - Interactive clickable progress indicator dots.
- **🧠 Interactive Multiple-Choice Quiz**:
  - Step-by-step single-question view with visual progress bar.
  - 4 selectable choices (A, B, C, D) with single-choice selection.
  - Submit Answer button locks in selection (prevents duplicate submission).
  - Immediate visual feedback: correct choices turn green (`✓`), incorrect turn red (`✗`), and distractors dim.
  - Detailed explanations accompany each question.
  - Final results card with score, percentage, and complete question breakdown.
  - **🔁 Retry Wrong Answers**: Filters down to only the questions missed so the user can master them.
  - **🔄 Restart Quiz**: Clears state and reloads all original questions.
- **🛡️ Complete Race Condition Protection**:
  - Employs browser `AbortController` to cancel stale in-flight requests.
  - Unique incrementing request IDs guarantee that older slow responses can never overwrite newer results.
- **🎨 Visual Consistency Across 3 Core States**:
  - **Empty State**: Features a floating icon badge, 3-step roadmap, and a "Try with sample notes" button.
  - **Loading State**: Features a dual-ring animated spinner, *"Generating your study material..."*, and locked inputs to prevent duplicate clicks.
  - **Error State**: Displays a friendly message, preserves previously generated content, and provides a **🔄 Retry** button.
- **📱 Responsive & Accessible**:
  - Mobile, tablet, and desktop layout with zero horizontal overflow.
  - 48px+ touch targets on all interactive buttons.
  - React Error Boundary wraps the app to prevent unhandled crashes.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 (Functional Components & Hooks) | UI component tree and state machine |
| **Bundler & Dev Server** | Vite 8 | Fast HMR and lightweight production builds |
| **Styling** | Plain CSS3 | CSS Variables, Flexbox, Grid, 3D Transforms (`perspective`, `rotateY`) |
| **Backend Runtime** | Node.js (v20+) & Express 5 | API proxy server and request validation |
| **AI SDK** | `@google/generative-ai` (`gemini-2.0-flash`) | Structured JSON extraction from raw notes |
| **Middleware & Tools** | `cors`, `dotenv`, `nodemon` | Cross-origin requests, environment variables, hot reloading |
| **Testing** | Node.js Test Runner & Assertions | 7 test suites, 51 automated assertions |

---

## 📁 Project Folder Structure

```
studymate-ai/
├── backend/
│   ├── utils/
│   │   ├── gemini.js                 # Gemini SDK client, prompt builder, timeout & key sanitization
│   │   └── validateStudyMaterial.js  # Reusable backend JSON schema validator
│   ├── tests/
│   │   ├── runValidationTests.js     # 14 schema invariant tests
│   │   ├── testData.js               # Valid and invalid test payloads
│   │   └── failureScenarios.test.js  # 10 failure scenario tests
│   ├── server.js                     # Express API entry point (POST /api/generate, GET /api/health)
│   ├── .env.example                  # Template for environment variables
│   ├── .gitignore                    # Excludes .env, node_modules, logs
│   └── package.json                  # Backend dependencies and scripts
│
├── frontend/
│   ├── src/
│   │   ├── assets/                   # Static SVG assets
│   │   ├── components/
│   │   │   ├── EmptyState.jsx / .css         # Empty dashboard placeholder with sample prompt
│   │   │   ├── ErrorBoundary.jsx             # React error boundary preventing white screens
│   │   │   ├── ErrorMessage.jsx / .css       # Error notification banner with Retry button
│   │   │   ├── FlashCard.jsx / .css          # 3D flippable card component
│   │   │   ├── FlashcardsSection.jsx / .css  # Single-card carousel with navigation
│   │   │   ├── Header.jsx / .css             # Sticky navigation header
│   │   │   ├── LoadingSpinner.jsx / .css     # Animated dual-ring loading card
│   │   │   ├── NotesInput.jsx / .css         # Textarea with character counter and sample pill
│   │   │   ├── QuizSection.jsx / .css        # Complete quiz engine and results summary
│   │   │   └── WelcomeBanner.jsx / .css      # Hero banner with feature pills
│   │   ├── services/
│   │   │   └── api.js                # API client with AbortController, timeout & validation
│   │   ├── utils/
│   │   │   └── validateStudyMaterial.js # Frontend schema validator
│   │   ├── App.jsx / .css            # Root component managing master dashboard state
│   │   ├── index.css                 # Global CSS variables, reset, and animations
│   │   └── main.jsx                  # React DOM entry point wrapped in ErrorBoundary
│   ├── tests/
│   │   ├── flashcardInteractions.test.js    # 7 carousel interaction tests
│   │   ├── quizInteractions.test.js         # 9 quiz engine tests
│   │   ├── frontendErrorHandling.test.js    # 4 frontend resilience tests
│   │   ├── raceConditionProtection.test.js  # 4 concurrency & race condition tests
│   │   └── applicationStates.test.js        # 3 state machine tests
│   ├── index.html                    # HTML shell with responsive viewport and title
│   ├── vite.config.js                # Vite config with backend proxy (/api -> :3001)
│   └── package.json                  # Frontend dependencies and scripts
│
├── tests/
│   └── fullE2ERound.test.js          # Master 18-point verification test suite
├── .gitignore                        # Root gitignore
└── README.md                         # Complete project documentation
```

---

## 📥 Installation Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 🔑 Environment Variable Configuration

The backend requires an environment file to store secrets securely. The API key is stored **only** on the backend and is never exposed to the client.

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` in your text editor and add your Mistral API key (or Gemini API key):
   ```env
   # Mistral AI — https://console.mistral.ai/api-keys/
   MISTRAL_API_KEY=your_actual_mistral_api_key_here
   MISTRAL_MODEL=mistral-small-latest

   # Or Google Gemini — https://aistudio.google.com/apikey
   GEMINI_API_KEY=your_actual_gemini_api_key_here

   PORT=3001
   ```

> **Note**: For automated local testing, setting `MOCK_AI_RESPONSE=true` enables instant offline testing without burning API quota.

---

## 🚀 Running the Application

To run the full stack, open **two terminal windows**:

### Terminal 1: Start the Express Backend
```bash
cd backend
npm run dev
```
- The backend will start on **http://localhost:3001**.
- Verify health: `curl http://localhost:3001/api/health`

### Terminal 2: Start the React Frontend
```bash
cd frontend
npm run dev
```
- Vite will start the frontend development server on **http://localhost:5173**.
- Open **http://localhost:5173** in your browser.

---

## 🤖 How AI Integration Works (Mistral AI & Google Gemini)

1. **Client Submits Notes**: The user pastes study notes into the frontend textarea.
2. **Backend Proxy (`POST /api/generate`)**: The frontend calls the Express backend, keeping the API keys (`MISTRAL_API_KEY` or `GEMINI_API_KEY`) strictly hidden from the client browser.
3. **Multi-Provider Architecture**:
   - **Mistral AI (Primary)**: Uses `mistral-small-latest` via Mistral's native endpoint with `response_format: { type: "json_object" }`.
   - **Google Gemini (Alternative)**: Uses `gemini-2.0-flash` with `responseMimeType: "application/json"`.
   - **Offline Mock**: Instant fallback for automated tests (`MOCK_AI_RESPONSE=true`).
4. **Structured Prompt Construction**: The backend builds a strict prompt instructing the model to act as an expert study assistant and return JSON matching the schema:
   ```json
   {
     "title": "Topic title",
     "flashcards": [{ "id": 1, "question": "...", "answer": "..." }],
     "quiz": [{ "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." }]
   }
   ```
5. **JSON Mode & Low Temperature**: Configured with strict JSON response format and `temperature: 0.3` to ensure deterministic, valid JSON output.
6. **Markdown Fence Stripping**: A utility function (`cleanJsonText`) strips any accidental ````json ```` code fences returned by the model.
7. **25-Second Timeout**: If the AI does not respond within 25 seconds, the request times out safely with HTTP 504.
8. **Secret Redaction**: Any logging functions sanitize output to ensure API keys (both `AIza...` and Mistral Bearer tokens) are never leaked to logs.

---

## 🔍 How Structured JSON is Validated

StudyMate AI employs a **dual-layer validation architecture**: data is validated once on the backend before transmission, and re-validated on the client before updating React state.

### Strict Schema Rules:
- `title`: Must be a non-empty string.
- `flashcards`: Must be an array of **exactly 5 items**. Each card must have:
  - `id`: Unique integer.
  - `question`: Non-empty string.
  - `answer`: Non-empty string.
- `quiz`: Must be an array of **exactly 5 items**. Each item must have:
  - `id`: Unique integer.
  - `question`: Non-empty string.
  - `options`: Array of **exactly 4 non-empty strings**.
  - `correctAnswer`: Integer strictly between **0 and 3**.
  - `explanation`: Non-empty string explaining the correct answer.

If any invariant fails, the validator returns `{ valid: false, errors: [...] }`. The backend responds with HTTP 502, and the frontend displays a friendly error banner with a **Retry** button.

---

## 🔄 State Management Architecture

The application uses standard React functional components and hooks (`useState`, `useEffect`, `useRef`).

### Flashcards State Machine
- `currentIndex`: Tracks the active card index (`0` to `4`).
- `isFlipped`: Boolean tracking whether the card is showing the question (false) or answer (true).
- **Auto-Reset**: Changing cards via Previous, Next, or dots automatically sets `isFlipped: false` so new cards always begin on the question side.

### Quiz State Machine
- `activeQuestions`: Array of current questions (holds all 5 originally, or filters down during retry mode).
- `selectedOption`: Index of the option clicked before submitting (`0–3`, or `-1` if unselected).
- `isSubmitted`: Boolean locking option buttons to prevent duplicate submissions.
- `answers`: Records each question result (`{ questionId, selectedOption, isCorrect, explanation, ... }`).
- `isFinished`: Boolean transitioning to the results score card.
- **Retry Wrong Answers**: Evaluates `answers.filter(a => !a.isCorrect)` and loads only those questions into `activeQuestions`.

### Race Condition Protection
When multiple generation requests are fired:
```javascript
// 1. Abort previous in-flight request
activeAbortControllerRef.current?.abort()

// 2. Track unique incrementing request ID
const currentRequestId = ++latestRequestIdRef.current

// 3. Only the latest request updates state
if (currentRequestId === latestRequestIdRef.current) {
  setStudyMaterial(data)
}
```

---

## 🛡️ Error Handling & Reliability

StudyMate AI explicitly handles 11 failure scenarios:

1. **Malformed JSON**: Strips code blocks, catches parse failures, returns HTTP 502 `MALFORMED_JSON`.
2. **Missing Flashcards/Quiz**: Caught by schema validator; incomplete responses are rejected.
3. **Incorrect Data Types**: Rejects non-string options, non-integer answers, or missing explanations.
4. **Empty AI Responses**: Caught before parsing and flagged as `EMPTY_RESPONSE`.
5. **Invalid `correctAnswer`**: Rejects values outside `0–3`.
6. **Network Failures**: Catches offline states (`!navigator.onLine`) and connection drops.
7. **Gemini API Errors**: Catches 400/403/500 errors from Google SDK and logs with keys redacted.
8. **Rate Limits**: Detects HTTP 429 / quota exhaustion and alerts the user to wait a moment.
9. **Slow Responses**: 30-second client timeout and 25-second backend timeout.
10. **Empty Input**: Validated on client and server before triggering AI.
11. **Content Preservation**: If a user generates new material and the request fails, existing valid flashcards and quizzes are **not wiped out**.

---

## 🧪 Testing & Verification

The project includes **7 test suites with 51 automated tests**, plus a master 18-point verification runner:

### Run the Complete 18-Point Verification Suite
```bash
node tests/fullE2ERound.test.js
```

### Run Individual Test Suites
```bash
# 1. Backend Schema Validation (14 tests)
node backend/tests/runValidationTests.js

# 2. Backend Failure Scenarios (10 tests)
node backend/tests/failureScenarios.test.js

# 3. Frontend Flashcard Carousel (7 tests)
node frontend/tests/flashcardInteractions.test.js

# 4. Frontend Quiz Engine (9 tests)
node frontend/tests/quizInteractions.test.js

# 5. Frontend Error Handling & Preservation (4 tests)
node frontend/tests/frontendErrorHandling.test.js

# 6. Race Condition Protection (4 tests)
node frontend/tests/raceConditionProtection.test.js

# 7. Application States (3 tests)
node frontend/tests/applicationStates.test.js
```

### Production Build Verification
```bash
cd frontend && npm run build
# Built in ~120ms with 0 errors
```

---

## ⚠️ Known Limitations

1. **Session-Only Persistence**: Study materials are stored in React state. Refreshing the browser resets the dashboard to the empty state (no database was required for this frontend internship scope).
2. **API Free-Tier Rate Limits**: Google AI Studio free tier keys have rate limits (e.g. 15 requests per minute). Rapid repeated requests may trigger HTTP 429.
3. **Minimum Note Length**: While the UI accepts any non-empty input, notes under 50 characters may produce general study material rather than specific questions.

---

## 💡 AI Usage Disclosure

In alignment with the assignment guidelines:
- **Google Gemini 2.0 Flash** powers the study material generation backend.
- AI assistance (Antigravity Agent) was used during development as an engineering pair-programmer to assist with:
  - Scaffolding the initial Vite + Express directory structure.
  - Authoring comprehensive unit and integration test suites.
  - Designing CSS keyframe animations and 3D card perspective transforms.
  - Reviewing code for race conditions and edge-case handling.
- All code, components, CSS styles, and test files were directly reviewed, tested, and validated against the assignment requirements.

---

## ⏱️ Actual Time Spent

| Phase | Description | Time Spent |
|---|---|:---:|
| **Phase 1** | Workspace inspection, Vite React setup & Express backend configuration | 25 mins |
| **Phase 2** | UI component library (Header, NotesInput, Cards, Quiz, CSS system) | 30 mins |
| **Phase 3** | JSON schema specification, validation functions & test data | 25 mins |
| **Phase 4** | Gemini AI SDK integration, prompt engineering & backend endpoints | 20 mins |
| **Phase 5** | Frontend-to-backend API wiring, proxy config & live data flow | 20 mins |
| **Phase 6** | Flashcard 3D carousel, flip animations & navigation boundaries | 25 mins |
| **Phase 7** | Complete quiz engine, scoring, feedback & Retry Wrong Answers | 30 mins |
| **Phase 8** | Failure handling (malformed JSON, rate limits, secret redaction) | 35 mins |
| **Phase 9** | Concurrency & race condition protection with AbortController | 25 mins |
| **Phase 10** | Polish application states (Empty, Loading, Error), typography & touch targets | 25 mins |
| **Phase 11** | Master 18-point verification test suite execution & documentation | 30 mins |
| **Total** | **Full end-to-end implementation and testing** | **~4.8 hours** |

---

## 👨‍💻 Author

Built as a Frontend Internship Assignment for **StudyMate AI**.
All tests passing (51/51). Ready for evaluation!

