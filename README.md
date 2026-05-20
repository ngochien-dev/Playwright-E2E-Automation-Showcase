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
│   │   ├── auth.spec.ts       # UI Login & Auth flow verification
│   │   ├── ddt-tasks.spec.ts  # Parameterized Data-Driven UI testing
│   │   ├── network-mock.spec.ts # Network interception & API Response Mocking (`page.route`)
│   │   └── tasks.spec.ts      # End-to-end task CRUD flows on the UI board
│   └── visual/
│       ├── visual.spec.ts     # Visual Regression & Snapshot Testing
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
   *The application will start at [http://localhost:3000](http://localhost:3000). You can log in manually using username: `admin` and password: `password123`.*

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

### 1. E2E UI Testing (`tests/ui/`)
Utilizes a modular **Page Object Model (POM)** structure.
- **`auth.spec.ts`**: Verifies login form rendering, invalid credentials validation alerts, successful session redirection, and secure logout.
- **`tasks.spec.ts`**: Validates task creation, column state progression (To Do ➔ In Progress ➔ Completed), detail updates via modals, and task deletion.

### 2. Visual Regression Testing (`tests/visual/`)
- **`visual.spec.ts`**: Uses `expect(locator).toHaveScreenshot()` to capture specific layout blocks (Login panel, Dashboard headers) and compares them against baselines to verify layout integrity (detecting font rendering shifts, color changes, and alignment issues).

### 3. API Mocking & Network Interception (`tests/ui/network-mock.spec.ts`)
- **`network-mock.spec.ts`**: Intercepts outgoing HTTP calls (`GET /api/tasks`) using `page.route` to return pre-defined mock datasets. This ensures the frontend layout can be tested independently of DB states or backend availability.

### 4. Data-Driven Testing (DDT) (`tests/ui/ddt-tasks.spec.ts`)
- **`ddt-tasks.spec.ts`**: Sources multiple testing profiles dynamically from an external JSON file (`tests/data/tasks-data.json`), loop-validating sequential scenarios dynamically.

### 5. REST API Testing (`tests/api/`)
- **`tasks-api.spec.ts`**: Bypasses the UI browser to verify backend HTTP endpoints directly. Tests token validation (JWT), correct HTTP response status codes (200 OK, 201 Created, 401 Unauthorized), and response JSON schema properties.

### 6. Database Layer Validation (`tests/db/`)
- **`db-check.spec.ts`**: Directly connects to the physical SQLite database using `sqlite3` driver. Executes queries on the database after UI and API operations to verify physical record synchronization (ensuring data integrity between frontend and database disk).

---

## 🛡️ Best Practices & Design Patterns Applied

- **Auto-Retrying Web Assertions:** Exclusively uses Playwright's dynamic wait assertions (e.g. `toHaveText`, `toBeVisible`) to prevent flaky test execution due to network latency or database read delays.
- **Database Reset Teardown API:** Integrates a dedicated `/api/db/reset` API endpoint invoked in `beforeEach` setups to ensure every test run starts with a clean database state.
- **Serial Test Execution:** Configured `workers: 1` in `playwright.config.ts` to prevent database write conflicts/locks on the embedded SQLite file.
- **Auto-Capture Diagnostics:** Configured to capture screenshots and video recordings *only on failure* to aid debugging.
