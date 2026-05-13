/**
 * ForgotPasswordPage.js — Page Object for /forgot-password
 *
 * Discovered live: page is linked from both /login and /signup headers.
 * Exact form structure confirmed via Playwright nav snapshot.
 */

const { BasePage } = require('./BasePage');

class ForgotPasswordPage extends BasePage {
  constructor(page) {
    super(page);
    this.path = '/forgot-password';

    // Best-effort locators — tightened once we visit the real page
    this.emailInput   = 'input[type="email"], input[placeholder*="email" i]';
    this.submitButton = 'button[type="submit"], button:has-text("Reset"), button:has-text("Submit"), button:has-text("Send")';
  }

  async navigate() {
    await this.goto(this.path);
    // Wait for either an email input or the page heading
    try {
      await this.waitForSelector(this.emailInput, { timeout: 8_000 });
    } catch {
      await this.waitForSelector('h1', { timeout: 5_000 });
    }
  }

  async fillEmail(value) {
    await this.fill(this.emailInput, value);
  }

  async clickSubmit() {
    await this.click(this.submitButton);
  }

  async submitEmail(email) {
    await this.fillEmail(email);
    await this.clickSubmit();
  }

  async getPageHeading() {
    return this.getText('h1');
  }

  async isEmailFieldVisible() {
    return this.isVisible(this.emailInput);
  }

  async getConfirmationMessage() {
    return this.getAlertText();
  }
}

module.exports = { ForgotPasswordPage };
