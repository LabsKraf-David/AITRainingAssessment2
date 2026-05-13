/**
 * NavigationPage.js — Page Object for the site-wide header & footer nav
 *
 * Links confirmed via Playwright snapshot:
 *   Header (logged-out):  Sign Up | Forgot Password | Connect
 *   Header (logged-in):   <varies>
 *   Footer: Tech Stack, QA, AI, Documents, Tools, Practice, Feedbacks, FAQs
 */

const { BasePage } = require('./BasePage');

class NavigationPage extends BasePage {
  constructor(page) {
    super(page);

    // Header links (logged-out state)
    this.logo       = 'a:has-text("CODESLAPS")';
    this.signUpLink = 'nav a[href="/signup"]';
    this.signInLink = 'nav a[href="/login"]';

    // Footer links
    this.footerLinks = {
      techStack : 'footer a[href="/tech-stack"], a[href="/tech-stack"]',
      qa        : 'footer a[href="/qa"], contentinfo a[href="/qa"]',
      practice  : 'a[href="/practice"]',
      feedback  : 'a[href="/feedback"]',
      tools     : 'a[href="/tools"]',
      documents : 'a[href="/documents"]',
      ai        : 'a[href="/ai"]',
    };
  }

  async getLogoText() {
    return this.getText(this.logo);
  }

  async clickLogo() {
    await this.click(this.logo);
    await this.waitForURL((u) => !u.toString().endsWith('/login'));
  }

  async clickSignUp() {
    await this.click(this.signUpLink);
    await this.waitForURL('**/signup');
  }

  async clickSignIn() {
    await this.click(this.signInLink);
    await this.waitForURL('**/login');
  }

  async isSignUpLinkVisible() { return this.isVisible(this.signUpLink); }
  async isSignInLinkVisible() { return this.isVisible(this.signInLink); }

  async navigateToFooterLink(key) {
    const selector = this.footerLinks[key];
    if (!selector) throw new Error(`Unknown footer link key: ${key}`);
    await this.click(selector);
  }
}

module.exports = { NavigationPage };
