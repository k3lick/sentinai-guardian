/**
 * GitHub device-flow auth helpers.
 *
 * All calls to GitHub's login endpoints go through the Cloudflare Worker
 * relay (RELAY_BASE) because github.com/login/* sends no CORS headers.
 * api.github.com does allow CORS, so the profile fetch goes direct.
 *
 * Tokens are stored in localStorage only and are never logged.
 */
import { CLIENT_ID, RELAY_BASE, SCOPE, SESSION_KEY } from './githubConfig.js';

function formBody(params) {
  return new URLSearchParams(params);
}

/**
 * Start the device flow. Returns
 * { device_code, user_code, verification_uri, expires_in, interval }.
 */
export async function requestDeviceCode() {
  const res = await fetch(`${RELAY_BASE}/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({ client_id: CLIENT_ID, scope: SCOPE }),
  });
  if (!res.ok) throw new Error(`Device code request failed (${res.status}).`);
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return {
    device_code: data.device_code,
    user_code: data.user_code,
    verification_uri: data.verification_uri,
    expires_in: data.expires_in,
    interval: data.interval,
  };
}

/**
 * Poll for the access token. Returns one of:
 *   { status: 'pending' }                          — keep polling
 *   { status: 'pending', slow_down: true }          — keep polling, slower
 *   { status: 'ok', access_token }                  — authorized
 *   { status: 'error', error }                      — expired_token /
 *     access_denied / incorrect_device_code / other
 */
export async function pollAccessToken(device_code) {
  const res = await fetch(`${RELAY_BASE}/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody({
      client_id: CLIENT_ID,
      device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  if (!res.ok) throw new Error(`Token request failed (${res.status}).`);
  const data = await res.json();
  if (data.access_token) return { status: 'ok', access_token: data.access_token };
  switch (data.error) {
    case 'authorization_pending':
      return { status: 'pending' };
    case 'slow_down':
      return { status: 'pending', slow_down: true };
    case 'expired_token':
    case 'access_denied':
    case 'incorrect_device_code':
      return { status: 'error', error: data.error };
    default:
      return { status: 'error', error: data.error || 'unknown_error' };
  }
}

/** Fetch the signed-in user's profile. Returns { login, name, avatar_url }. */
export async function fetchGitHubUser(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub profile request failed (${res.status}).`);
  const data = await res.json();
  return { login: data.login, name: data.name, avatar_url: data.avatar_url };
}

/** Persist the session. The token stays in this browser only. */
export function saveSession({ login, name, avatar_url, token }) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ login, name, avatar_url, token, at: Date.now() }),
  );
}

/** Load the persisted session, or null. */
export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

/** Clear the persisted session. */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
