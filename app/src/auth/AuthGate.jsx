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
 *   idle → code (device code shown, polling) → authed / error
 *
 * The user enters the shown code at github.com/login/device and authorizes
 * the "SentinAI Guardian" OAuth App; this screen polls until GitHub grants
 * the token. Sign-in is via GitHub and the token stays in this browser only.
 */
export default function AuthGate({ onAuthed }) {
  const [stage, setStage] = useState('idle'); // idle | code | error
  const [device, setDevice] = useState(null); // { device_code, user_code, verification_uri, expires_in }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pollTimer = useRef(null);
  const pollInterval = useRef(5000);

  function stopPolling() {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  function fail(message) {
    stopPolling();
    setError(message);
    setStage('error');
    setBusy(false);
  }

  function poll(deviceCode, startedAt, expiresIn) {
    pollTimer.current = setTimeout(async () => {
      try {
        if (Date.now() - startedAt > expiresIn * 1000) {
          return fail('This code has expired. Start again to get a fresh code.');
        }
        const result = await pollAccessToken(deviceCode);
        if (result.status === 'ok') {
          stopPolling();
          const profile = await fetchGitHubUser(result.access_token);
          const session = { ...profile, token: result.access_token };
          saveSession(session);
          onAuthed({ login: profile.login, name: profile.name, avatar_url: profile.avatar_url });
          return;
        }
        if (result.status === 'error') {
          if (result.error === 'expired_token') {
            return fail('This code has expired. Start again to get a fresh code.');
          }
          if (result.error === 'access_denied') {
            return fail('Authorization was denied on GitHub. Start again when ready.');
          }
          return fail('Something went wrong with this code. Start again to get a fresh one.');
        }
        if (result.slow_down) pollInterval.current = Math.min(pollInterval.current * 2, 30000);
        poll(deviceCode, startedAt, expiresIn);
      } catch {
        fail('Could not reach GitHub. Check your connection and start again.');
      }
    }, pollInterval.current);
  }

  async function start() {
    setError('');
    setBusy(true);
    try {
      const data = await requestDeviceCode();
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
