# Web Automation Testing Showcase Project 🚀

[![Playwright Tests CI](https://github.com/ngochien-dev/Playwright-E2E-Automation-Showcase/actions/workflows/playwright.yml/badge.svg)](https://github.com/ngochien-dev/Playwright-E2E-Automation-Showcase/actions/workflows/playwright.yml)
[![Live Test Report](https://img.shields.io/badge/Live_Report-GitHub_Pages-brightgreen?logo=github)](https://ngochien-dev.github.io/Playwright-E2E-Automation-Showcase/)

This is a comprehensive, production-ready Web Automation Testing Showcase Project designed to demonstrate modern QA automation engineering competencies. It features a **fully functional target web application** (SleekTask Manager) and a robust **Playwright automation suite** that tests across multiple system boundaries: UI, API, Network, and the Database layer.

> **Live Test Report:** You can view the live automated test execution results directly online at [https://ngochien-dev.github.io/Playwright-E2E-Automation-Showcase/](https://ngochien-dev.github.io/Playwright-E2E-Automation-Showcase/) (automatically generated and deployed via GitHub Actions CI/CD on every commit).

The target application has been localized to Vietnamese (representing localized market application testing), while the automated test suite contains English specs, full Page Object Model (POM) abstractions, visual regression checks, API mocking, and data-driven validations.

---

## 🛠️ Tech Stack & Tooling

- **Language:** TypeScript & Node.js
- **Target Web App:** Express.js, HTML5, modern HSL CSS Grid, Vanilla JS Single Page App (SPA)
- **Database:** SQLite (Embedded DB queried directly via SQL during test verification)
- **Automation Runner:** Playwright Test Runner (TypeScript)
- **Design Pattern:** Page Object Model (POM)
- **DevOps & Containers:** Docker, Docker Compose
- **CI/CD Integration:** GitHub Actions Workflows
- **Configuration:** Dynamic environment variables via `dotenv`

---

## 📂 Project Directory Structure

```text
├── .github/workflows/
│   └── playwright.yml         # CI/CD pipeline for automated test execution on GitHub Actions
├── app/
│   ├── public/
│   │   ├── app.js             # Client-side SPA interaction logic (Vietnamese comments)
│   │   ├── index.html         # Frontend DOM layout
│   │   └── styles.css         # Modern Glassmorphic UI styling
│   ├── database.sqlite        # SQLite DB file (generated automatically, gitignored)
│   └── server.js              # Express REST API Server (Vietnamese comments)
├── tests/
│   ├── api/
│   │   └── tasks-api.spec.ts  # REST API Testing (JWT Auth, HTTP Status Codes, payload assertions)
│   ├── data/
│   │   └── tasks-data.json    # Parameterized dataset for Data-Driven Testing (DDT)
│   ├── db/
│   │   └── db-check.spec.ts   # DB Verification: Queries SQLite directly using raw SQL
│   ├── pages/
│   │   ├── BasePage.ts        # POM: Core base page utility class
│   │   ├── LoginPage.ts       # POM: Object mapping for the authentication view
│   │   └── DashboardPage.ts   # POM: Object mapping for the task manager dashboard
│   ├── ui/
│   │   ├── activity-log.spec.ts # Audit trail E2E verification
│   │   ├── analytics.spec.ts    # Analytics chart rendering validation
│   │   ├── assignment.spec.ts   # Task assignment & user lookup test
│   │   ├── auth.spec.ts         # UI Login & Auth flow verification
│   │   ├── batch-actions.spec.ts # Bulk actions & priorities select mode test [NEW]
│   │   ├── comments.spec.ts     # Comment system E2E verification
│   │   ├── ddt-tasks.spec.ts    # Parameterized Data-Driven UI testing
│   │   ├── dependencies.spec.ts # Task dependency block validation
│   │   ├── due-dates.spec.ts    # Due date rendering & warning levels test
│   │   ├── export-csv.spec.ts   # CSV export file contents validation
│   │   ├── file-upload.spec.ts  # File upload & download verification
│   │   ├── network-mock.spec.ts # Network interception & API Response Mocking (`page.route`)
│   │   ├── notifications.spec.ts # Real-time notification badge & dropdown test
│   │   ├── quick-subtasks.spec.ts # Quick subtask check toggle on card hover test [NEW]
│   │   ├── rbac.spec.ts         # Role-Based Access Control E2E validation
│   │   ├── realtime-sync.spec.ts # SSE Real-time synchronization verification
│   │   ├── recycle-bin.spec.ts  # Soft-delete, restore, and permanent delete test
│   │   ├── register.spec.ts     # Multi-role user registration E2E validation
│   │   ├── rich-text.spec.ts    # Rich Text Editor (Quill.js) E2E verification
│   │   ├── search-highlight.spec.ts # Live search visual highlighting and dimming test [NEW]
│   │   ├── search-priority.spec.ts # Filtering by keyword/priority test
│   │   ├── subtasks.spec.ts     # Checklist subtask creation & progress bar test
│   │   └── tasks.spec.ts        # End-to-end task CRUD flows on the UI board
│   └── visual/
│       ├── dark-mode.spec.ts    # Dark/Light mode theme visual comparison
│       ├── visual.spec.ts       # Visual Regression & Snapshot Testing
│       └── visual.spec.ts-snapshots/ # Platform baseline reference screenshots
├── Dockerfile                 # Multi-stage build Dockerfile for the web application
├── docker-compose.yml         # Orchestrates target app health checks & Playwright container tests
├── playwright.config.ts       # Global Playwright configurations
├── tsconfig.json              # TypeScript compilation configurations
├── .env.example               # Template environment configuration file
├── .env                       # Local environment configurations (gitignored)
└── package.json               # Package dependencies and run scripts
```

---

## ⚙️ Installation & Test Execution

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20 recommended)
- [Docker & Docker Compose](https://www.docker.com/) (Optional, for containerized execution)

### Method 1: Local Host Execution

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```

3. **Install Playwright Browsers:**
   ```bash
   npx playwright install
   ```

4. **Start the Target Web Application:**
   ```bash
   npm run start:app
   ```
   *The application will start at [http://localhost:3001](http://localhost:3001). You can log in manually using username: `admin` and password: `password123`.*

5. **Run the Automated Test Suite:**
   *Open a new terminal window and run:*
   ```bash
   npm run test
   ```

6. **View HTML Test Report:**
   ```bash
   npm run test:report
   ```

---

### Method 2: Containerized Execution (Docker Compose)

To verify the test suite in a clean, isolated container environment matching CI:

1. **Start target app & run tests automatically via Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   *This command spins up the Express target app, verifies its health check status, launches a headless Playwright container to run the suite, and outputs test execution logs directly to the console.*

---

## 🧪 Testing Coverage Details

The project features a **102 test cases suite** testing across all core components of a modern collaborative web application.

### 🌟 Premium Features Implemented (Phase 5 & 6)
- **SSE Real-time Synchronization:** Utilizes Server-Sent Events to automatically synchronize client dashboards in real-time when another user makes changes. Verified via parallel multi-browser context testing (`tests/ui/realtime-sync.spec.ts`).
- **In-app Notification Center:** Glassmorphic notification bell with unread badge counters. Generates Toast alerts and database notifications for assignees/commenters.
- **Soft-Delete & Recycle Bin:** Standard deletion puts cards in a drawer-based Recycle Bin from which they can be restored or permanently removed.
- **Task Dependencies:** Prevents completing blocked tasks before their dependencies are resolved (returns `400 Bad Request` at backend and triggers modal block in UI).
- **Kanban Board Batch Actions:** Multi-select mode allowing users to check multiple cards and apply bulk priority updates or move them to the Recycle Bin in a single request (`PUT /api/tasks/batch`).
- **Card Subtasks Quick-Toggle:** Hovering over a card renders its checklists directly on the board, allowing instant status updates without opening modals.
- **Live Search Task Highlight:** Goggles neon visual highlights around matching task cards and dims non-matching ones, preserving columns layout.

### 🔍 Automated Testing Layers
1. **End-to-End UI Testing (`tests/ui/`):** Comprehensive browser test coverage verifying all user interactions, workflows, drag-and-drop, and forms validations.
2. **Visual Regression Testing (`tests/visual/`):** Pixel-matching checks using `toHaveScreenshot()` to catch visual regressions on theme variations (Dark/Light Mode) and critical modules.
3. **API Mocking (`tests/ui/network-mock.spec.ts`):** Uses Playwright's `page.route` to mock JSON payloads and network responses, validating UI resiliency.
4. **Data-Driven Testing (DDT) (`tests/ui/ddt-tasks.spec.ts`):** Executes tests dynamically sourced from JSON matrices.
5. **REST API Testing (`tests/api/`):** Headless verification of backend REST API structures, authorization scopes, JWT handling, and return payload schemes.
6. **Database Layer Validation (`tests/db/`):** Connects directly to SQLite using `sqlite3` raw queries to audit database state matches post UI/API operations.

---

## 🛡️ Best Practices & Design Patterns Applied

- **Auto-Retrying Web Assertions:** Exclusively uses Playwright's dynamic wait assertions (e.g. `toHaveText`, `toBeVisible`) to prevent flaky test execution due to network latency or database read delays.
- **Database Reset Teardown API:** Integrates a dedicated `/api/db/reset` API endpoint invoked in `beforeEach` setups to ensure every test run starts with a clean database state.
- **Serial Test Execution:** Configured `workers: 1` in `playwright.config.ts` to prevent database write conflicts/locks on the embedded SQLite file.
- **Auto-Capture Diagnostics:** Configured to capture screenshots and video recordings *only on failure* to aid debugging.
- **Express Route Ordering:** Static endpoint routes (e.g. `/api/tasks/batch`) are resolved before parameterized endpoints (e.g. `/api/tasks/:id`) to prevent matching collisions.
- **Timezone-Agnostic Calculations:** Date checks (e.g., due date badge warning states) are performed by comparing absolute timestamps (`diffTime`), ensuring consistent tests across diverse runner environments.
