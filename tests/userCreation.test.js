/**
 * userCreation.test.js  — API E2E suite for www.codeslaps.com
 * Run:  node tests/userCreation.test.js
 */
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? '0';

const api    = require('./apiClient');
const { readTestUsers, appendResults } = require('./excelHelper');
const config = require('../config/config');
const fs     = require('fs');
const path   = require('path');

const results = [];
let passed = 0, failed = 0;

async function test(name, fn) {
  const entry = { testName: name, email: '', status: '', httpStatus: '', message: '', timestamp: new Date().toISOString() };
  try {
    const info = await fn();
    if (info) Object.assign(entry, info);
    entry.status = 'PASS';
    console.log(`  ✅  PASS  ${name}`);
    passed++;
  } catch (err) {
    entry.status  = 'FAIL';
    entry.message = err.message;
    console.error(`  ❌  FAIL  ${name}\n           ${err.message}`);
    failed++;
  }
  results.push(entry);
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

const PERF_BUDGET_MS = 3000;

function assertStatus(res, ...expected) {
  assert(expected.includes(res.status), `Expected ${expected.join('/')}, got ${res.status} — ${res.url}`);
}
function assertPerf(res) {
  assert(res.elapsed < PERF_BUDGET_MS, `${res.elapsed}ms exceeded ${PERF_BUDGET_MS}ms — ${res.url}`);
}
function assertHTML(res) {
  const ct = res.headers['content-type'] || '';
  assert(ct.includes('text/html'), `Expected text/html, got "${ct}" — ${res.url}`);
}
function assertContains(body, fragment) {
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  assert(str.toLowerCase().includes(fragment.toLowerCase()), `Body missing "${fragment}"`);
}

async function runSuite() {
  console.log('\n════════════════════════════════════════════════════');
  console.log('  API E2E Tests — www.codeslaps.com');
  console.log(`  Date: ${new Date().toISOString()}`);
  console.log('════════════════════════════════════════════════════\n');

  // 1. Excel data
  let testUsers = [];
  await test('Excel: Load test-user data', async () => {
    testUsers = readTestUsers();
    assert(testUsers.length > 0, 'No test users in Excel');
    console.log(`         Loaded ${testUsers.length} user(s)`);
  });
  await test('Excel: Validate required columns', async () => {
    for (const u of testUsers) assert(u.email, `Missing "email": ${JSON.stringify(u)}`);
  });

  // 2. Smoke tests
  const pages = [
    ['/', 'Homepage'], ['/qa', 'QA'], ['/ai', 'AI'], ['/signup', 'Signup'],
    ['/login', 'Login'], ['/forgot-password', 'Forgot Password'],
    ['/tools', 'Tools'], ['/documents', 'Documents'], ['/tech-stack', 'Tech Stack'],
  ];
  for (const [endpoint, label] of pages) {
    await test(`Smoke: GET ${endpoint} — ${label} returns 200`, async () => {
      const res = await api.get(endpoint);
      assertStatus(res, 200);
      assertHTML(res);
      assertPerf(res);
      return { httpStatus: res.status };
    });
  }

  // 3. Branding
  await test('Smoke: Homepage contains CODESLAPS branding', async () => {
    const res = await api.get('/');
    assertContains(res.body, 'CODESLAPS');
    return { httpStatus: res.status };
  });

  // 4. Negative route
  await test('Negative: Non-existent route returns 404 or graceful 200', async () => {
    const res = await api.get('/this-page-does-not-exist-xyz');
    assert([404, 200].includes(res.status), `Unexpected status ${res.status}`);
    return { httpStatus: res.status };
  });

  // 5. Security
  await test('Security: Homepage uses HTTPS', async () => {
    const res = await api.get('/');
    assert(res.url.startsWith('https://'), `Not HTTPS: ${res.url}`);
    return { httpStatus: res.status };
  });
  await test('Security: X-Frame-Options or CSP header present', async () => {
    const res = await api.get('/');
    assert('x-frame-options' in res.headers || 'content-security-policy' in res.headers, 'No security headers');
    return { httpStatus: res.status };
  });

  // 6. Performance
  await test(`Performance: Homepage < ${PERF_BUDGET_MS}ms`, async () => {
    const res = await api.get('/');
    assertPerf(res);
    console.log(`         ${res.elapsed}ms`);
    return { httpStatus: res.status };
  });

  // 7. Feedback form (data-driven)
  for (const user of testUsers) {
    await test(`Form: POST /feedback for "${user.email}"`, async () => {
      const res = await api.post('/feedback', {
        name:    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Test User',
        email:   user.email,
        message: user.notes || 'Automated E2E test — please ignore.',
      });
      assert(res.status < 500, `Server error ${res.status}`);
      assertPerf(res);
      return { email: user.email, httpStatus: res.status };
    });
  }
  await test('Form: POST /feedback — empty fields, no 500', async () => {
    const res = await api.post('/feedback', { name: '', email: '', message: '' });
    assert(res.status < 500, `Server error ${res.status}`);
    return { httpStatus: res.status };
  });
  await test('Form: POST /feedback — invalid email, no 500', async () => {
    const res = await api.post('/feedback', { name: 'X', email: 'not-an-email', message: 'test' });
    assert(res.status < 500, `Server error ${res.status}`);
    return { httpStatus: res.status };
  });

  // 8. Append results to Excel
  await test('Excel: Append results to reports/test-results.xlsx', async () => {
    appendResults(results);
    const p = path.resolve(__dirname, '..', config.excel.resultsFile);
    assert(fs.existsSync(p), `Results file not found at ${p}`);
    console.log(`         Report: ${p}`);
  });

  console.log('\n════════════════════════════════════════════════════');
  console.log(`  API Results: ${passed} passed  |  ${failed} failed`);
  console.log('════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runSuite().catch((err) => {
  console.error('Unhandled suite error:', err);
  process.exit(1);
});
