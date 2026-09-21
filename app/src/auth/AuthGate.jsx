import { useState } from 'react';

/**
 * Auth gate mirroring the live app's flow:
 *   sign up → email verification code (6 digits, shown in the dev banner) →
 *   session persisted. RLS-style scoping: every record stores `createdBy`.
 */
export default function AuthGate({ onAuthed, devCode }) {
  const [mode, setMode] = useState('signup'); // signup | login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState('credentials'); // credentials | verify
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (stage === 'credentials') {
      if (mode === 'signup') setStage('verify');
      else {
        const user = JSON.parse(localStorage.getItem('sentinai.user') || 'null');
        if (user && user.email === email && user.password === password) {
          localStorage.setItem('sentinai.session', JSON.stringify({ email, at: Date.now() }));
          onAuthed(user);
        } else setError('Invalid email or password.');
      }
      return;
    }
    if (code.trim() !== devCode) return setError('Invalid verification code.');
    const user = { email, password };
    localStorage.setItem('sentinai.user', JSON.stringify(user));
    localStorage.setItem('sentinai.session', JSON.stringify({ email, at: Date.now() }));
    onAuthed(user);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-900 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-slate-50">SentinAI</span>
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Agent Security Ops</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div className="bg-ink-700/40 border border-ok/30 rounded-lg px-3 py-2 text-xs text-ok font-mono">
            dev mode: verification code is <span className="font-bold">{devCode}</span>
          </div>

          <h2 className="text-lg font-semibold text-slate-100">
            {mode === 'signup' ? (stage === 'verify' ? 'Check your email' : 'Create your account') : 'Welcome back'}
          </h2>

          {stage === 'credentials' && (
            <>
              <input className="input" type="email" placeholder="you@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)} />
              <input className="input" type="password" placeholder="Password (min 8 chars)" value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </>
          )}

          {stage === 'verify' && (
            <input className="input tracking-[0.5em] text-center" inputMode="numeric" maxLength={6}
              placeholder="••••••" value={code} onChange={(e) => setCode(e.target.value)} />
          )}

          {error && <p className="text-xs text-crit">{error}</p>}

          <button type="submit" className="btn-primary w-full">
            {stage === 'verify' ? 'Verify code' : mode === 'signup' ? 'Sign up' : 'Log in'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="text-ok hover:underline"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setStage('credentials'); setError(''); }}>
              {mode === 'signup' ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
