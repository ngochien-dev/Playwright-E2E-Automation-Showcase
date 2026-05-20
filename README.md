# Web Automation Testing Showcase Project 🚀

This is a comprehensive, production-ready Web Automation Test Suite designed to showcase QA Engineering skills including UI Automation, API Testing, Database Assertions, Dockerization, and CI/CD setup. 

The project features a **self-contained target application** (a sleek dark-mode Task Manager) and an automated test suite verifying system integrations across UI, HTTP API, and DB boundaries.

---

## 🛠️ Tech Stack Mapping (Matching CV Profile)

- **Languages:** JavaScript/TypeScript (Node.js)
- **Target Web App:** Express.js, HTML5, HSL-tailored CSS Grid, Vanilla JS Single Page App (SPA)
- **Database:** SQLite (Embedded DB queried directly via SQL in testing)
- **Automation Framework:** Playwright Test Runner (TypeScript)
- **Design Pattern:** Page Object Model (POM)
- **DevOps & Containers:** Docker, Docker Compose
- **CI/CD:** GitHub Actions Workflows

---

## 📂 Project Directory Structure

```text
├── .github/workflows/
│   └── playwright.yml         # GitHub Actions CI/CD Pipeline
├── app/
│   ├── public/
│   │   ├── app.js             # Client SPA application logic
│   │   ├── index.html         # Modern HTML layout
│   │   └── styles.css         # Glassmorphism dark mode styles
│   ├── database.sqlite        # SQLite local DB file (created on runtime)
│   └── server.js              # Express API Server and REST backend
├── tests/
│   ├── api/
│   │   └── tasks-api.spec.ts  # REST API testing (mimicking automated Postman checks)
│   ├── db/
│   │   └── db-check.spec.ts   # Direct database verification using SQL queries
│   ├── pages/
│   │   ├── BasePage.ts        # Common page utility parent class
│   │   ├── LoginPage.ts       # POM implementation of Login flow
│   │   └── DashboardPage.ts   # POM implementation of Task board actions
│   └── ui/
│       ├── auth.spec.ts       # Authentication UI validation tests
│       └── tasks.spec.ts      # Task CRUD dashboard UI tests
├── Dockerfile                 # Container setup for Web Application
├── docker-compose.yml         # Local orchestration of app & tests
├── playwright.config.ts       # Playwright execution configuration
├── tsconfig.json              # TypeScript compiler settings
└── package.json               # Node dependency mappings and run scripts
```

---

## ⚙️ How to Setup and Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20 recommended)
- [Docker & Docker Compose](https://www.docker.com/) (Optional, for containerized runs)

### Method 1: Running Directly on Local Host

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Start the Web Application:**
   ```bash
   npm run start:app
   ```
   *The target web app will be available at [http://localhost:3000](http://localhost:3000). You can log in manually using username `admin` and password `password123`.*

4. **Execute the automation test suite:**
   *Open a separate terminal window and run:*
   ```bash
   npm run test
   ```

5. **View the interactive HTML test report:**
   ```bash
   npm run test:report
   ```

---

### Method 2: Running via Docker (Fully Containerized)

Verify container execution and orchestration using Docker Compose:

1. **Build and run target application + tests:**
   ```bash
   docker-compose up --build
   ```
   *This commands automatically spins up the target web app container, runs a health check to make sure it's active, runs the Playwright test suite in a headless Linux environment container, and prints test logs to terminal.*

---

## 🧪 Test Coverage Breakdown

### 1. UI Automation Tests (`tests/ui/`)
Adheres strictly to the **Page Object Model (POM)** structure.
- **`auth.spec.ts`**: Verifies login form layouts, incorrect credentials showing proper error flags, successful authentication redirects, and local storage token cleanup on logout.
- **`tasks.spec.ts`**: Verifies task card creations, task details loading, moving tasks through columns ("To Do" -> "In Progress" -> "Completed"), modal edits, and deletion triggers.

### 2. API Automated Tests (`tests/api/`)
Performs raw API contract testing using Playwright's `request` interface.
- **`tasks-api.spec.ts`**: Validates request validation headers (`Authorization`), verifies JWT token retrievals from login request payloads, asserts proper CRUD response status codes (201 Created, 200 OK, 401 Unauthorized), and payload formats.

### 3. Database Validation Tests (`tests/db/`)
Connects directly to SQLite database using SQL statements during execution.
- **`db-check.spec.ts`**: Validates data persistence. Asserts that task creations triggered via UI or API are written exactly as rows in the SQL table `tasks`, testing integration boundaries.

---

## 🛡️ Key Automation Best Practices Implemented

- **Page Object Model (POM):** Decoupled locators from test logic for maximum maintainability.
- **DB Reset Teardown API:** The backend exposes a `/api/db/reset` endpoint triggered before tests to clear mock tables and initialize default entries, preventing test cross-contamination.
- **Serial Worker Execution:** Configured single-threaded workers (`workers: 1`) to ensure SQLite database transaction integrity during test executions.
- **Automatic Test Artifacts:** Configured Playwright to capture screenshots and record videos *only on test failure* to assist in triage and debugging.
