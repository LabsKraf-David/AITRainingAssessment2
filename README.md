# AITrainingProject2 — E2E Tests for www.codeslaps.com

Full E2E test suite (API + UI) with Page Object Model, driven by Excel test data.

---

## MCP Tools Used

| MCP Tool | Role |
|---|---|
| **filesystem** | Scaffold project, resolve paths, save screenshots, verify reports |
| **excel** | Read test-user rows from `TestUsers` sheet; write pass/fail results |
| **rest-api** | API-level smoke, form submission, security & performance tests |
| **playwright** | Browser automation — live site inspection & UI test execution |

---

## Project Structure

```
AITrainingProject2/
├── config/
│   └── config.js                        # API base URL, endpoints, Excel paths
│
├── data/
│   └── test-users.xlsx                  # Test input (seeded by seedTestData.js)
│
├── reports/
│   ├── test-results.xlsx                # API + UI pass/fail output
│   ├── screenshots/                     # PNG per test (always) + FAIL_ on error
│   └── playwright-html/                 # Playwright HTML report
│
├── tests/
│   │
│   ├── pages/                           ← Page Object Model classes
│   │   ├── BasePage.js                  # Shared Playwright helpers, screenshot()
│   │   ├── SignupPage.js                # /signup — Create Account form
│   │   ├── LoginPage.js                 # /login  — Sign In form
│   │   └── NavigationPage.js           # Header & footer nav links
│   │
│   ├── ui/
│   │   └── userCreation.ui.test.js      # UI test suite (uses POM + Excel)
│   │
│   ├── apiClient.js                     # fetch() wrapper
│   ├── excelHelper.js                   # SheetJS read/write helpers
│   └── userCreation.test.js             # API test suite
│
├── playwright.config.js                 # Multi-browser config
├── seedTestData.js                      # Creates data/test-users.xlsx
└── package.json
```

---

## Quick Start

```bash
cd /Users/cunninghamd1/Projects/AITrainingProject2

# 1. Install dependencies (xlsx + Playwright)
npm install
npx playwright install chromium          # install browser binaries

# 2. Seed the Excel test-data file
npm run seed

# 3. Run API tests only
npm run test:api

# 4. Run UI tests only (headless Chromium)
npm run test:ui:chromium

# 5. Run UI tests with a visible browser (useful for debugging)
npm run test:ui:headed

# 6. Open the Playwright HTML report
npm run test:ui:report

# 7. Run everything
npm run test:all
```

---

## Page Object Model

Each class lives in `tests/pages/` and extends `BasePage`:

### BasePage
Shared helpers: `goto()`, `fill()`, `click()`, `selectOption()`, `waitForSelector()`,
`getAlertText()`, `screenshot(name)`.

### SignupPage (`/signup`)
| Field | Locator |
|---|---|
| Name | `input[placeholder="Enter your name"]` |
| Email ID | `input[placeholder="Enter your email"]` |
| Password | `input[placeholder="Create a password"]` |
| Confirm Password | `input[placeholder="Confirm your password"]` |
| Designation | `input[placeholder="Enter your designation"]` |
| Country | `<select>` (named country options) |
| Submit | `button:has-text("Create Account")` |

Key methods: `navigate()`, `createUser(userObj)`, `waitForSuccessRedirect()`, `getSubmissionMessage()`.

### LoginPage (`/login`)
| Field | Locator |
|---|---|
| Email ID | `input[placeholder="Enter your email"]` |
| Password | `input[placeholder="Enter your password"]` |
| Submit | `button:has-text("Sign In")` |

Key methods: `navigate()`, `login(email, password)`, `getErrorMessage()`.

### NavigationPage
Covers logo, header Sign Up / Sign In links, and footer link navigation.

---

## UI Tests Covered

### Signup Page — Structure
- Navigate to `/signup`, heading = "Create Account"
- All required fields visible (Name, Email, Country, Submit)
- Page title contains "Codeslaps"

### Navigation
- Sign In link visible in header on Signup page
- Logo navigates to homepage

### Data-Driven User Creation (from Excel)
- Reads every row from `data/test-users.xlsx → TestUsers`
- Fills the signup form and submits
- Accepts: redirect away from `/signup` OR success alert message
- Unique email per run (appends timestamp) to avoid duplicate accounts
- Screenshot captured after every submission

### Validation
- Empty form → stays on `/signup` or shows error
- Mismatched passwords → blocked by browser or server
- Invalid email format → blocked by HTML5 or server

### Login Page — Structure & Negative Tests
- Navigate to `/login`, heading = "Sign In"
- Sign Up link visible in header
- Invalid credentials → stays on `/login` or shows error
- Empty form → blocked

### Navigation Flows
- Signup → Sign In link → `/login`
- Login → Sign Up link → `/signup`

### Excel Results
- All UI results written to `reports/test-results.xlsx`
- Prefixed `[UI]` to distinguish from API test rows

---

## Adding Test Users

Add rows to the `TestUsers` sheet in `data/test-users.xlsx`.
Required column: `email`. Optional: `firstName`, `lastName`, `password`, `role`, `country`, `notes`.

Each new row becomes an additional data-driven signup test automatically.

---

## Running on Multiple Browsers

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-chrome
npx playwright test                      # all four
```

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | `https://www.codeslaps.com` | Override for staging/dev |
| `API_BASE_URL` | `https://www.codeslaps.com` | API test target |
