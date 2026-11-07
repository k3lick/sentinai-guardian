/**
 * GitHub device-flow auth config — the single place for auth settings.
 *
 * The OAuth App "SentinAI Guardian" already exists with Device Flow enabled.
 * CLIENT_ID is a public client id: it is safe to embed in the shipped app.
 * There is NO client secret for this app and none is needed — never generate,
 * request, or store one.
 *
 * GitHub's login endpoints (github.com/login/*) send no CORS headers, so the
 * browser cannot call them directly. All device-flow calls go through the
 * Cloudflare Worker relay at RELAY_BASE instead — never call
 * github.com/login/* from this app.
 */

// Public OAuth App client id for "SentinAI Guardian" (device flow).
export const CLIENT_ID = 'Ov23liyx8BkeZC2aa4dr';

// Minimal scope: read the signed-in user's public profile only.
export const SCOPE = 'read:user';

// Where the user enters the device code (opened in a new tab).
export const VERIFY_URL = 'https://github.com/login/device';

// localStorage key for the persisted session { login, name, avatar_url, token }.
export const SESSION_KEY = 'sentinai.session';

// Cloudflare Worker relay that proxies GitHub's device-flow endpoints with
// CORS headers (github.com/login/* sends none). All relay calls go through
// RELAY_BASE. Deployed 7 Nov 2026; source in ~/workspace/sentinai-auth/.
export const RELAY_BASE = 'https://sentinai-auth.100kelick.workers.dev';
