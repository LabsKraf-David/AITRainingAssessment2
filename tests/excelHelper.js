/**
 * excelHelper.js
 * Reads test-user data from the Excel test data sheet,
 * and writes / appends test results to the results sheet.
 *
 * Uses the `xlsx` npm package (SheetJS community edition).
 */

const XLSX   = require('xlsx');
const path   = require('path');
const fs     = require('fs');
const config = require('../config/config');

const DATA_FILE    = path.resolve(__dirname, '..', config.excel.testDataFile);
const RESULTS_FILE = path.resolve(__dirname, '..', config.excel.resultsFile);

const HEADERS = ['runId', 'testName', 'email', 'status', 'httpStatus', 'message', 'timestamp'];

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Read test users from the TestUsers sheet.
 * @returns {Array<Object>}
 */
function readTestUsers() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`Test data file not found: ${DATA_FILE}\nRun: npm run seed`);
  }
  const wb = XLSX.readFile(DATA_FILE);
  const ws = wb.Sheets[config.excel.testDataSheet];
  if (!ws) {
    throw new Error(`Sheet "${config.excel.testDataSheet}" not found in ${DATA_FILE}`);
  }
  return XLSX.utils.sheet_to_json(ws);
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * APPEND results for a single run — preserves history across runs.
 * Each run gets a unique runId so rows are traceable.
 * @param {Array<Object>} results
 */
function appendResults(results) {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });

  let wb, existingRows;

  if (fs.existsSync(RESULTS_FILE)) {
    wb = XLSX.readFile(RESULTS_FILE);
    const ws = wb.Sheets[config.excel.resultsSheet];
    existingRows = ws ? XLSX.utils.sheet_to_json(ws, { header: 1 }) : [HEADERS];
  } else {
    wb = XLSX.utils.book_new();
    existingRows = [HEADERS];
  }

  // Append new rows
  for (const r of results) {
    existingRows.push(HEADERS.map((h) => (h === 'runId' ? runId : (r[h] ?? ''))));
  }

  const newWs = XLSX.utils.aoa_to_sheet(existingRows);
  // Auto-width columns
  newWs['!cols'] = HEADERS.map(() => ({ wch: 36 }));

  if (wb.SheetNames.includes(config.excel.resultsSheet)) {
    wb.Sheets[config.excel.resultsSheet] = newWs;
  } else {
    XLSX.utils.book_append_sheet(wb, newWs, config.excel.resultsSheet);
  }

  XLSX.writeFile(wb, RESULTS_FILE);
}

/**
 * OVERWRITE the results sheet (used when you want a clean slate for one run).
 * @param {Array<Object>} results
 */
function writeAllResults(results) {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });

  const rows = [
    HEADERS,
    ...results.map((r) => HEADERS.map((h) => (h === 'runId' ? runId : (r[h] ?? '')))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = HEADERS.map(() => ({ wch: 36 }));

  let wb;
  if (fs.existsSync(RESULTS_FILE)) {
    wb = XLSX.readFile(RESULTS_FILE);
    wb.Sheets[config.excel.resultsSheet] = ws;
    if (!wb.SheetNames.includes(config.excel.resultsSheet)) {
      wb.SheetNames.push(config.excel.resultsSheet);
    }
  } else {
    wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.excel.resultsSheet);
  }
  XLSX.writeFile(wb, RESULTS_FILE);
}

module.exports = { readTestUsers, appendResults, writeAllResults };
