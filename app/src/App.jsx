import { useState as useReactState, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Overview from './pages/Overview.jsx';
import Guardrails from './pages/Guardrails.jsx';
import Documents from './pages/Documents.jsx';
import Incidents from './pages/Incidents.jsx';
import AuditLog from './pages/AuditLog.jsx';
import ModelRegistry from './pages/ModelRegistry.jsx';
import Siem from './pages/Siem.jsx';
import Simple from './pages/Simple.jsx';
import AuthGate from './auth/AuthGate.jsx';
import { load, metrics } from './lib/db.js';

const DEV_CODE = '659314'; // simulated email-verification code (shown in the UI)

export default function App() {
  const dbRef = useRef(null);
  if (!dbRef.current) dbRef.current = load();

  const [user, setUser] = useSession();
  const [page, setPage] = useNav();
  const m = useMemo(() => metrics(dbRef.current), [page, user]);

  if (!user) return <AuthGate onAuthed={setUser} devCode={DEV_CODE} />;

  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} user={user}
        onLogout={() => { localStorage.removeItem('sentinai.session'); setUser(null); }}
        chainIntact={m.chainIntact} />
      <main className="flex-1 min-w-0 p-6 lg:p-8">
        {page === 'overview' && <Overview db={dbRef.current} setPage={setPage} />}
        {page === 'guardrails' && <Guardrails dbRef={dbRef} />}
        {page === 'documents' && <Documents dbRef={dbRef} />}
        {page === 'incidents' && <Incidents dbRef={dbRef} />}
        {page === 'audit' && <AuditLog dbRef={dbRef} />}
        {page === 'registry' && <ModelRegistry dbRef={dbRef} />}
        {page === 'siem' && <Siem dbRef={dbRef} />}
        {['orchestration', 'sla', 'approvals', 'governance', 'compliance', 'settings'].includes(page) && (
          <Simple dbRef={dbRef} page={page} />
        )}
      </main>
    </div>
  );
}

function useSession() {
  const [user, setUser] = useReactState(() => {
    try {
      const session = JSON.parse(localStorage.getItem('sentinai.session') || 'null');
      return session ? { email: session.email } : null;
    } catch { return null; }
  });
  return [user, setUser];
}

function useNav() {
  return useReactState('overview');
}
