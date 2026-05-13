/**
 * apiClient.js
 * Thin wrapper around the native fetch API for REST calls.
 * Node 18+ ships fetch natively; no extra dependencies needed.
 */

const https = require('https');
const config = require('../config/config');

// Allow self-signed / local-CA certs in dev (matches Postman's behaviour)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function request(method, path, body = null, extraHeaders = {}) {
  const url = `${config.api.baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/html,application/json',
      ...extraHeaders,
    },
    redirect: 'follow',
  };

  if (body) options.body = JSON.stringify(body);

  const start = Date.now();
  const res = await fetch(url, options);
  const elapsed = Date.now() - start;

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML response — that's fine */ }

  return {
    status: res.status,
    ok: res.ok,
    headers: Object.fromEntries(res.headers),
    body: json ?? text,
    elapsed,
    url,
  };
}

module.exports = {
  get:    (path, headers)       => request('GET',    path, null, headers),
  post:   (path, body, headers) => request('POST',   path, body, headers),
  put:    (path, body, headers) => request('PUT',    path, body, headers),
  delete: (path, headers)       => request('DELETE', path, null, headers),
};
