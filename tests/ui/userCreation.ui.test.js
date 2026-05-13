/**
 * userCreation.ui.test.js  — @playwright/test version
 *
 * UI E2E tests for www.codeslaps.com using:
 *   - @playwright/test   (official test runner + fixtures)
 *   - Page Object Model  (tests/pages/)
 *   - Excel              (test data from data/test-users.xlsx)
 *   - Filesystem         (screenshots in reports/screenshots/)
 *
 * Run:  npx playwright test --project=chromium
 */

const { test, expect } = require('@playwright/test');
const { SignupPage }      = require('../pages/SignupPage');
const { LoginPage }       = require('../pages/LoginPage');
const { NavigationPage }  = require('../pages/NavigationPage');
const { ForgotPasswordPage } = require('../pages/ForgotPasswordPage');
const { readTestUsers, appendResults } = require('../excelHelper');
const path = require('path');
const fs   = require('fs');

// ── Shared test data (loaded once) ───────────────────────────────────────────
let testUsers = [];
try {
  testUsers = readTestUsers();
} catch (e) {
  console.warn('⚠️  Could not load test-users.xlsx — run `npm run seed` first.');
}

function mapExcelUserToSignup(u, index) {
  const ts = Date.now();
  return {
    name:            `${u.firstName || 'Test'} ${u.lastName || 'User'}`.trim(),
    email:           u.email.replace('@', `+${ts}${index}@`),
    password:        u.password        || 'Test@1234!',
    confirmPassword: u.password        || 'Test@1234!',
    designation:     u.role            || 'QA Engineer',
    country:         u.country         || 'United Kingdom',
  };
}

// ── Result collector (flushed in afterAll) ────────────────────────────────────
const runResults = [];
function recordResult(testName, status, email = '', httpStatus = '', message = '') {
  runResults.push({ testName, email, status, httpStatus, message, timestamp: new Date().toISOString() });
}

// ── afterAll: write results to Excel ─────────────────────────────────────────
test.afterAll(() => {
  try {
    appendResults(runResults);
    console.log('📊  UI results appended to reports/test-results.xlsx');
  } catch (e) {
    console.error('Could not write Excel results:', e.message);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Signup Page Structure
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Signup Page — Structure', () => {
  test('has "Create Account" heading', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    const heading = await signup.getPageHeading();
    expect(heading).toContain('Create Account');
    await signup.screenshot('signup-heading');
    recordResult('Signup Page: heading', 'PASS');
  });

  test('all required fields are visible', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    expect(await signup.isNameFieldVisible()).toBe(true);
    expect(await signup.isEmailFieldVisible()).toBe(true);
    expect(await signup.isCountryDropdownVisible()).toBe(true);
    expect(await signup.isSubmitButtonVisible()).toBe(true);
    recordResult('Signup Page: fields visible', 'PASS');
  });

  test('page title contains "Codeslaps"', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    await expect(page).toHaveTitle(/Codeslaps/i);
    recordResult('Signup Page: page title', 'PASS');
  });

  test('password and confirm-password fields are of type password', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    const pwType  = await signup.getAttribute(signup.passwordInput, 'type');
    const cpwType = await signup.getAttribute(signup.confirmPasswordInput, 'type');
    expect(pwType).toBe('password');
    expect(cpwType).toBe('password');
    recordResult('Signup Page: password field types', 'PASS');
  });

  test('name and email fields show character counter', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    // Counters start at 0/50
    const body = await page.content();
    expect(body).toContain('0/50');
    recordResult('Signup Page: character counter visible', 'PASS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — Data-driven User Creation (from Excel)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('User Creation — data-driven from Excel', () => {
  for (let i = 0; i < testUsers.length; i++) {
    const raw  = testUsers[i];
    const user = mapExcelUserToSignup(raw, i);

    test(`create user "${user.name}" (row ${i + 1} of ${testUsers.length})`, async ({ page }) => {
      const signup = new SignupPage(page);
      await signup.navigate();
      await signup.createUser(user);

      const redirected    = await signup.waitForSuccessRedirect();
      const alertText     = await signup.getSubmissionMessage();
      const successAlert  = alertText && /success|created|registered|check your email/i.test(alertText);
      const errorAlert    = alertText && /error|already|invalid|failed/i.test(alertText);

      await signup.screenshot(`signup-user${i + 1}-${user.name.replace(/\s+/g, '-').toLowerCase()}`);

      if (errorAlert) {
        recordResult(`User Creation: ${user.name}`, 'FAIL', raw.email, '', alertText);
        throw new Error(`Signup rejected for "${user.email}": ${alertText}`);
      }
      expect(redirected || successAlert).toBeTruthy();
      recordResult(`User Creation: ${user.name}`, 'PASS', raw.email);
    });
  }

  test('skips gracefully when no Excel data loaded', async ({ page }) => {
    // Verify at least the signup page loads even if no data
    const signup = new SignupPage(page);
    await signup.navigate();
    expect(await signup.isSubmitButtonVisible()).toBe(true);
    recordResult('User Creation: no-data guard', 'PASS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — Validation
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Validation — signup form', () => {
  test('empty form does not proceed', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    await signup.click(signup.submitButton);
    await page.waitForTimeout(1000);

    const url   = signup.getCurrentUrl();
    const alert = await signup.getSubmissionMessage();
    await signup.screenshot('validation-empty-form');

    expect(url.includes('/signup') || (alert && alert.trim().length > 0)).toBeTruthy();
    recordResult('Validation: empty form', 'PASS');
  });

  test('mismatched passwords are rejected', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    await signup.fillName('Mismatch Test');
    await signup.fillEmail('mismatch.test@testdomain.com');
    await signup.fillPassword('Password1!');
    await signup.fillConfirmPassword('Different99!');
    await signup.fillDesignation('Tester');
    await signup.selectCountry('United Kingdom');
    await signup.click(signup.submitButton);
    await page.waitForTimeout(1000);

    const url   = signup.getCurrentUrl();
    const alert = await signup.getSubmissionMessage();
    await signup.screenshot('validation-mismatched-passwords');

    expect(url.includes('/signup') || (alert && alert.trim().length > 0)).toBeTruthy();
    recordResult('Validation: mismatched passwords', 'PASS');
  });

  test('invalid email format is rejected', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    await signup.fillName('Bad Email');
    await signup.fillEmail('not-an-email');
    await signup.fillPassword('Password1!');
    await signup.fillConfirmPassword('Password1!');
    await signup.fillDesignation('Tester');
    await signup.selectCountry('United Kingdom');
    await signup.click(signup.submitButton);
    await page.waitForTimeout(1000);

    const url = signup.getCurrentUrl();
    await signup.screenshot('validation-invalid-email');
    // HTML5 validation keeps us on the page
    expect(url).toContain('/signup');
    recordResult('Validation: invalid email', 'PASS');
  });

  test('name field respects 50-character maxlength', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    const longName = 'A'.repeat(60);
    await signup.fillName(longName);
    const val = await page.inputValue(signup.nameInput);
    expect(val.length).toBeLessThanOrEqual(50);
    recordResult('Validation: name maxlength', 'PASS');
  });

  test('email field respects 50-character maxlength', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    const longEmail = 'a'.repeat(45) + '@b.com'; // 51 chars
    await signup.fillEmail(longEmail);
    const val = await page.inputValue(signup.emailInput);
    expect(val.length).toBeLessThanOrEqual(50);
    recordResult('Validation: email maxlength', 'PASS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — Login Page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Login Page', () => {
  test('has "Sign In" heading', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    const heading = await login.getPageHeading();
    expect(heading).toContain('Sign In');
    await login.screenshot('login-heading');
    recordResult('Login Page: heading', 'PASS');
  });

  test('Sign Up link visible in header', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    expect(await login.isSignUpLinkVisible()).toBe(true);
    recordResult('Login Page: signup link', 'PASS');
  });

  test('invalid credentials stay on login page', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    await login.login('nobody@nowhere.com', 'WrongPass999!');
    await page.waitForTimeout(2000);

    const url   = login.getCurrentUrl();
    const error = await login.getErrorMessage();
    await login.screenshot('login-invalid-creds');

    expect(url.includes('/login') || (error && error.trim().length > 0)).toBeTruthy();
    recordResult('Login Page: invalid credentials', 'PASS');
  });

  test('empty login form does not proceed', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    await login.click(login.submitButton);
    await page.waitForTimeout(1000);

    const url = login.getCurrentUrl();
    await login.screenshot('login-empty-submit');
    expect(url).toContain('/login');
    recordResult('Login Page: empty form', 'PASS');
  });

  test('password field is masked', async ({ page }) => {
    const login = new LoginPage(page);
    await login.navigate();
    const type = await login.getAttribute(login.passwordInput, 'type');
    expect(type).toBe('password');
    recordResult('Login Page: password masked', 'PASS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — Forgot Password Page
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Forgot Password Page', () => {
  test('has correct heading', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.navigate();
    const heading = await fp.getPageHeading();
    expect(heading).toBeTruthy();
    await fp.screenshot('forgot-password-page');
    recordResult('Forgot Password: heading', 'PASS');
  });

  test('email field is visible', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.navigate();
    expect(await fp.isEmailFieldVisible()).toBe(true);
    recordResult('Forgot Password: email field', 'PASS');
  });

  test('submit with unknown email does not cause 500', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.navigate();
    await fp.submitEmail('unknown@nobody.com');
    await page.waitForTimeout(2000);
    // Page should not crash — check no error heading
    const title = await fp.getTitle();
    expect(title).toContain('Codeslaps');
    await fp.screenshot('forgot-password-submit');
    recordResult('Forgot Password: unknown email submit', 'PASS');
  });

  test('submit with empty email does not proceed', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.navigate();
    await fp.clickSubmit();
    await page.waitForTimeout(1000);
    const url = fp.getCurrentUrl();
    expect(url).toContain('/forgot-password');
    recordResult('Forgot Password: empty submit', 'PASS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6 — Navigation Flows
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Navigation Flows', () => {
  test('Signup → Sign In link → Login page', async ({ page }) => {
    const signup = new SignupPage(page);
    const nav    = new NavigationPage(page);
    await signup.navigate();
    await nav.clickSignIn();
    expect(page.url()).toContain('/login');
    recordResult('Nav: Signup → Login', 'PASS');
  });

  test('Login → Sign Up link → Signup page', async ({ page }) => {
    const login = new LoginPage(page);
    const nav   = new NavigationPage(page);
    await login.navigate();
    await nav.clickSignUp();
    expect(page.url()).toContain('/signup');
    recordResult('Nav: Login → Signup', 'PASS');
  });

  test('Logo on Signup navigates to homepage', async ({ page }) => {
    const signup = new SignupPage(page);
    const nav    = new NavigationPage(page);
    await signup.navigate();
    await nav.clickLogo();
    expect(page.url()).toMatch(/codeslaps\.com\/?$/);
    recordResult('Nav: Logo → Homepage', 'PASS');
  });

  test('Signup page has Forgot Password link in header', async ({ page }) => {
    const signup = new SignupPage(page);
    await signup.navigate();
    const hasFP = await signup.isVisible('a[href="/forgot-password"]');
    expect(hasFP).toBe(true);
    recordResult('Nav: Forgot Password link visible', 'PASS');
  });
});
