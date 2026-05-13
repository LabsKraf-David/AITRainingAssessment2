/**
 * BasePage.js  — Page Object Model base class
 *
 * Every page object extends this. Provides shared Playwright helpers,
 * navigation utilities, and screenshot capture for the report.
 */

class BasePage {
  /**
   * @param {import('playwright').Page} page  — Playwright page instance
   */
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || 'https://www.codeslaps.com';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  async goto(path = '/') {
    await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
  }

  async getTitle() {
    return this.page.title();
  }

  getCurrentUrl() {
    return this.page.url();
  }

  // ── Waiting ───────────────────────────────────────────────────────────────

  async waitForSelector(selector, options = {}) {
    return this.page.waitForSelector(selector, { timeout: 10_000, ...options });
  }

  async waitForURL(pattern, options = {}) {
    return this.page.waitForURL(pattern, { timeout: 10_000, ...options });
  }

  // ── Interactions ──────────────────────────────────────────────────────────

  async fill(selector, value) {
    await this.waitForSelector(selector);
    await this.page.fill(selector, value);
  }

  async click(selector) {
    await this.waitForSelector(selector);
    await this.page.click(selector);
  }

  async selectOption(selector, value) {
    await this.waitForSelector(selector);
    await this.page.selectOption(selector, value);
  }

  async getText(selector) {
    await this.waitForSelector(selector);
    return this.page.textContent(selector);
  }

  async isVisible(selector) {
    try {
      await this.waitForSelector(selector, { state: 'visible', timeout: 5_000 });
      return true;
    } catch {
      return false;
    }
  }

  async getAttribute(selector, attr) {
    await this.waitForSelector(selector);
    return this.page.getAttribute(selector, attr);
  }

  // ── Alerts / Toasts ───────────────────────────────────────────────────────

  async getAlertText() {
    try {
      // Codeslaps uses role="alert" for inline messages
      await this.page.waitForSelector('[role="alert"]', { timeout: 5_000 });
      return this.page.textContent('[role="alert"]');
    } catch {
      return null;
    }
  }

  // ── Screenshot ────────────────────────────────────────────────────────────

  async screenshot(name) {
    const safeName = name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `reports/screenshots/${safeName}-${ts}.png`;
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }
}

module.exports = { BasePage };
