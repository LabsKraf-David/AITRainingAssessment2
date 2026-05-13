#!/usr/bin/env node
/**
 * seedTestData.js — creates data/test-users.xlsx
 * Run: node seedTestData.js
 */
const XLSX = require('xlsx');
const path = require('path');
const fs   = require('fs');

const outPath = path.resolve(__dirname, 'data', 'test-users.xlsx');
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const headers = ['firstName', 'lastName', 'email', 'username', 'password', 'role', 'country', 'notes'];
const rows = [
  ['Alice', 'Smith', 'alice.smith@testdomain.com', 'alice.smith', 'P@ssw0rd!23', 'user',  'United Kingdom', 'Primary E2E test user'],
  ['Bob',   'Jones', 'bob.jones@testdomain.com',   'bob.jones',   'S3cur3Pass!', 'admin', 'United States',  'Admin role test user'],
  ['Carol', 'White', 'carol.white@testdomain.com', 'carol.white', 'MyP@ss789!',  'user',  'Ireland',        'Third user — bulk test'],
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
ws['!cols'] = headers.map(() => ({ wch: 30 }));

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'TestUsers');
XLSX.writeFile(wb, outPath);

console.log(`✅  Seeded ${rows.length} test users → ${outPath}`);
