/**
 * LoginPage.js — Page Object for /login (Sign In)
 *
 * Real form fields discovered via Playwright snapshot on 2026-05-13:
 *   Email ID *   placeholder "Enter your email"
 *   Password *   placeholder "Enter your password"
 *   button       "Sign In"
 *
 * Successful login redirects away from /login.
 * Failed login shows an inline [role="alert"] message.
 */

const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/login';

    this.emailInput    = 'input[placeholder="Enter your email"]';
    this.passwordInput = 'input[placeholder="Enter your password"]';
    this.submitButton  = 'button:has-text("Sign In")';
    this.signUpLink    = 'a[href="/signup"]';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigate() {
    await this.goto(this.path);
    await this.waitForSelector(this.submitButton);
  }

  // ── Form Helpers ──────────────────────────────────────────────────────────

  async fillEmail(value)    { await this.fill(this.emailInput, value); }
  async fillPassword(value) { await this.fill(this.passwordInput, value); }

  async login(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.click(this.submitButton);
  }

  // ── Assertions / Queries ─────────────────────────────────────────────────

  async getPageHeading() {
    return this.getText('h1');
  }

  async isOnLoginPage() {
    return this.getCurrentUrl().includes('/login');
  }

  async waitForSuccessRedirect() {
    try {
      await this.waitForURL((url) => !url.toString().includes('/login'), { timeout: 8_000 });
      return true;
    } catch {
      return false;
    }
  }

  async getErrorMessage() {
    return this.getAlertText();
  }

  async isSignUpLinkVisible() {
    return this.isVisible(this.signUpLink);
  }
}

module.exports = { LoginPage };
