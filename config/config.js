// config.js — aligned with www.codeslaps.com
module.exports = {
  api: {
    baseUrl: process.env.API_BASE_URL || 'https://www.codeslaps.com',
    timeout: 10000,
  },
  ui: {
    baseUrl: process.env.BASE_URL || 'https://www.codeslaps.com',
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0', 10),
    viewport: { width: 1280, height: 800 },
  },
  excel: {
    testDataFile:  './data/test-users.xlsx',
    resultsFile:   './reports/test-results.xlsx',
    testDataSheet: 'TestUsers',
    resultsSheet:  'Results',
  },
  endpoints: {
    home:          '/',
    signup:        '/signup',
    login:         '/login',
    forgotPassword:'/forgot-password',
    qa:            '/qa',
    practice:      '/practice',
    feedback:      '/feedback',
    ai:            '/ai',
    tools:         '/tools',
    documents:     '/documents',
    techStack:     '/tech-stack',
    notFound:      '/this-page-does-not-exist-xyz',
  },
  userCreation: {
    uiEndpoint:  '/signup',
    apiEndpoint: '/feedback',   // feedback form is the only public POST endpoint
  },
};
