import { useEffect, useRef, useState } from 'react';
import { Github, ExternalLink, RotateCcw, X } from 'lucide-react';
import Shield from '../components/Shield.jsx';
import { VERIFY_URL } from '../lib/githubConfig.js';
import {
  requestDeviceCode,
  pollAccessToken,
  fetchGitHubUser,
  saveSession,
} from '../lib/githubAuth.js';

/**
 * GitHub device-flow sign-in:
 *   idle → code (device code shown, polling) → authed / expired / error
 *
 * The user enters the shown code at github.com/login/device and authorizes
 * the "SentinAI Guardian" OAuth App; this screen polls until GitHub grants
 * the token. Sign-in is via GitHub and the token stays in this browser only.
 *
 * Cancel is real: one AbortController covers the whole attempt (poll +
 * profile fetch). Cancelling aborts any in-flight request, so a late
 * response can never complete sign-in after the user cancelled.
 */
export default function AuthGate({ onAuthed }) {
  const [stage, setStage] = useState('idle'); // idle | code | authed | expired | error
  const [device, setDevice] = useState(null); // { device_code, user_code, verification_uri, expires_in }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pollTimer = useRef(null);
  const pollInterval = useRef(5000);
  const abortRef = useRef(null);

  function clearPollTimer() {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }

  function stopPolling() {
    clearPollTimer();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  function fail(message) {
    stopPolling();
    setError(message);
    setStage('error');
    setBusy(false);
  }

  function failExpired(message) {
    stopPolling();
    setError(message);
    setStage('expired');
    setBusy(false);
  }

  function poll(deviceCode, startedAt, expiresIn) {
    pollTimer.current = setTimeout(async () => {
      // Capture this attempt's signal: if the user cancelled (or started
      // over) while a request was in flight, this signal is aborted and
      // every exit below is a silent return — never a sign-in, never a
      // reschedule, never an error overwriting the cancelled state.
      const signal = abortRef.current?.signal;
      try {
        if (signal?.aborted) return;
        if (Date.now() - startedAt > expiresIn * 1000) {
          return failExpired('This code has expired. Start again to get a fresh code.');
        }
        const result = await pollAccessToken(deviceCode, signal);
        if (signal?.aborted) return;
        if (result.status === 'ok') {
          // No more polls are needed, but do NOT abort here: the profile
          // fetch below runs under this same signal and must survive.
          clearPollTimer();
          let profile;
          try {
            profile = await fetchGitHubUser(result.access_token, signal);
          } catch (e) {
            if (signal?.aborted || e?.name === 'AbortError') return;
            // The token was already granted but no session was saved and
            // the token is not recorded anywhere. Say so plainly, so the
            // user can revoke it knowingly instead of retrying blind.
            return fail('GitHub granted the sign-in, but your profile could not be fetched, so no session was saved. The granted token was not stored here — revoke "SentinAI Guardian" at github.com/settings/applications if you do not want it active, then start again.');
          }
          if (signal?.aborted) return;
          const session = { ...profile, token: result.access_token };
          saveSession(session);
          setStage('authed');
          onAuthed({ login: profile.login, name: profile.name, avatar_url: profile.avatar_url });
          return;
        }
        if (result.status === 'error') {
          if (result.error === 'expired_token') {
            return failExpired('This code has expired. Start again to get a fresh code.');
          }
          if (result.error === 'access_denied') {
            return fail('Authorization was denied on GitHub. Start again when ready.');
          }
          return fail('Something went wrong with this code. Start again to get a fresh one.');
        }
        if (result.slow_down) pollInterval.current = Math.min(pollInterval.current * 2, 30000);
        poll(deviceCode, startedAt, expiresIn);
      } catch (e) {
        if (signal?.aborted || e?.name === 'AbortError') return;
        fail('Could not reach GitHub. Check your connection and start again.');
      }
    }, pollInterval.current);
  }

  async function start() {
    setError('');
    setBusy(true);
    try {
      const data = await requestDeviceCode();
      abortRef.current = new AbortController();
      setDevice(data);
      setStage('code');
      setBusy(false);
      pollInterval.current = 5000;
      poll(data.device_code, Date.now(), data.expires_in || 900);
    } catch {
      setBusy(false);
      fail('Could not start GitHub sign-in. Check your connection and try again.');
    }
  }

  function restart() {
    stopPolling();
    setDevice(null);
    setError('');
    setStage('idle');
    setBusy(false);
  }

  const expiresMinutes = device?.expires_in ? Math.round(device.expires_in / 60) : null;

  return (
    <div className="auth-texture min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Shield className="w-16 h-16 text-ok mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-50">SentinAI</p>
          <p className="text-xs uppercase tracking-widest text-slate-500">Agent Security Ops</p>
        </div>

        <div className="card p-6 space-y-4">
          {stage === 'idle' && (
            <>
              <h2 className="text-lg font-semibold text-slate-100">Sign in to continue</h2>
              <p className="text-sm text-slate-400">
                SentinAI uses your GitHub account to sign you in. Your token stays in this browser.
              </p>
              <button onClick={start} disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
                <Github className="w-4 h-4" />
                {busy ? 'Starting…' : 'Continue with GitHub'}
              </button>
            </>
          )}

          {stage === 'code' && device && (
            <>
              <h2 className="text-lg font-semibold text-slate-100">Enter this code on GitHub</h2>
              <p className="text-center font-mono text-3xl tracking-[0.3em] text-slate-50 bg-ink-900 border border-ink-700/50 rounded-lg py-3 select-all">
                {device.user_code}
              </p>
              <a
                href={device.verification_uri || VERIFY_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Open github.com/login/device <ExternalLink className="w-4 h-4" />
              </a>
              {expiresMinutes && (
                <p className="text-xs text-slate-500 text-center">
                  This code expires in about {expiresMinutes} minutes.
                </p>
              )}
              <p className="text-sm text-slate-400 text-center">Waiting for GitHub authorization…</p>
              <button onClick={restart} className="btn-ghost w-full flex items-center justify-center gap-1.5">
                <X className="w-3 h-3" /> Cancel
              </button>
            </>
          )}

          {stage === 'authed' && (
            <>
              <h2 className="text-lg font-semibold text-slate-100">Signed in</h2>
              <p className="text-sm text-slate-400">Opening SentinAI…</p>
            </>
          )}

          {stage === 'expired' && (
            <>
              <h2 className="text-lg font-semibold text-slate-100">This code expired</h2>
              <p className="text-sm text-crit">{error}</p>
              <button onClick={restart} className="btn-primary w-full flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Start again
              </button>
            </>
          )}

          {stage === 'error' && (
            <>
              <h2 className="text-lg font-semibold text-slate-100">Sign-in didn&apos;t complete</h2>
              <p className="text-sm text-crit">{error}</p>
              <button onClick={restart} className="btn-primary w-full flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" /> Start again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
