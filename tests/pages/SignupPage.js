/**
 * SignupPage.js — Page Object for /signup (Create Account)
 *
 * Real form fields discovered via Playwright snapshot on 2026-05-13:
 *   Name *           placeholder "Enter your name"          (maxlength 50)
 *   Email ID *       placeholder "Enter your email"         (maxlength 50)
 *   Password *       placeholder "Create a password"
 *   Confirm Password * placeholder "Confirm your password"
 *   Designation *    placeholder "Enter your designation"
 *   Country *        <select> with named country options
 *   button           "Create Account"
 *
 * After successful submission the site redirects to /login (or shows an alert).
 */

const { BasePage } = require('./BasePage');

class SignupPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/signup';

    // ── Locators (label-text or placeholder — resilient to class changes) ──
    this.nameInput            = 'input[placeholder="Enter your name"]';
    this.emailInput           = 'input[placeholder="Enter your email"]';
    this.passwordInput        = 'input[placeholder="Create a password"]';
    this.confirmPasswordInput = 'input[placeholder="Confirm your password"]';
    this.designationInput     = 'input[placeholder="Enter your designation"]';
    this.countrySelect        = 'select';          // only one <select> on page
    this.submitButton         = 'button:has-text("Create Account")';

    // Character-counter spans (visible beside Name and Email)
    this.nameCounter  = ':nth-match(:text("0/50"), 1)';
    this.emailCounter = ':nth-match(:text("0/50"), 2)';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigate() {
    await this.goto(this.path);
    await this.waitForSelector(this.submitButton);
  }

  // ── Form Helpers ──────────────────────────────────────────────────────────

  async fillName(value)        { await this.fill(this.nameInput, value); }
  async fillEmail(value)       { await this.fill(this.emailInput, value); }
  async fillPassword(value)    { await this.fill(this.passwordInput, value); }
  async fillConfirmPassword(v) { await this.fill(this.confirmPasswordInput, v); }
  async fillDesignation(value) { await this.fill(this.designationInput, value); }
  async selectCountry(value)   { await this.selectOption(this.countrySelect, value); }

  /**
   * Fill every field from a user object and click "Create Account".
   * @param {{ name, email, password, confirmPassword, designation, country }} user
   */
  async createUser(user) {
    await this.fillName(user.name);
    await this.fillEmail(user.email);
    await this.fillPassword(user.password);
    await this.fillConfirmPassword(user.confirmPassword ?? user.password);
    await this.fillDesignation(user.designation ?? 'QA Engineer');
    await this.selectCountry(user.country ?? 'United Kingdom');
    await this.click(this.submitButton);
  }

  // ── Assertions / Queries ─────────────────────────────────────────────────

  async getPageHeading() {
    return this.getText('h1');
  }

  async isOnSignupPage() {
    return this.getCurrentUrl().includes('/signup');
  }

  /**
   * Returns true when the page navigates away from /signup (success redirect).
   */
  async waitForSuccessRedirect() {
    try {
      await this.waitForURL((url) => !url.toString().includes('/signup'), { timeout: 8_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the inline alert/error message shown by the site after submission.
   */
  async getSubmissionMessage() {
    return this.getAlertText();
  }

  async isNameFieldVisible()    { return this.isVisible(this.nameInput); }
  async isEmailFieldVisible()   { return this.isVisible(this.emailInput); }
  async isCountryDropdownVisible() { return this.isVisible(this.countrySelect); }
  async isSubmitButtonVisible() { return this.isVisible(this.submitButton); }
}

module.exports = { SignupPage };
