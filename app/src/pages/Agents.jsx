import { useState } from 'react';
import { Card, SectionTitle, Empty } from '../components/ui.jsx';
import { createAgent, setAgentStatus, list } from '../lib/db.js';
import { notifyDbChanged, useDb } from '../components/ui.jsx';

// Display helpers — never invent a value for an unset field, and never
// call a string method on a possibly-undefined field.
function displayText(v) {
  const s = (v || '').trim();
  return s || 'not set';
}

function displayTools(tools) {
  if (!Array.isArray(tools) || tools.length === 0) return 'not set';
  return tools.join(', ');
}

function displayDate(a) {
  const raw = a.createdAt || a.timestamp;
  if (!raw) return '—';
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export default function Agents({ dbRef, user }) {
  const force = useDb();
  const db = dbRef.current;
  const agents = list(db, 'agents');
  const actor = user?.login || 'system@acme-core.example';

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [model, setModel] = useState('');
  const [toolsText, setToolsText] = useState('');
  const [spendLimit, setSpendLimit] = useState('');
  const [status, setStatus] = useState('active');
  const [error, setError] = useState('');

  function submit() {
    setError('');
    const tools = toolsText.split(',').map((t) => t.trim()).filter(Boolean);
    const res = createAgent(db, { name, role, model, tools, spendLimit, status }, actor);
    if (!res.ok) {
      setError(res.error || 'Could not create agent.');
      return;
    }
    setName(''); setRole(''); setModel(''); setToolsText(''); setSpendLimit(''); setStatus('active');
    notifyDbChanged();
    force();
  }

  function toggle(a) {
    const next = (a.status || 'active') === 'active' ? 'paused' : 'active';
    const res = setAgentStatus(db, a.id, next, actor);
    if (!res.ok) {
      setError(res.error || 'Could not update agent.');
      return;
    }
    setError('');
    notifyDbChanged();
    force();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">Agents</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle title="Create agent" sub="Registered agents are governed by guardrails, SIEM and audit" />
          <label className="text-xs text-slate-500 block mb-1">Name</label>
          <input className="input mb-3" placeholder="agent name (e.g. aetherbot)" value={name}
            onChange={(e) => setName(e.target.value)} />
          <label className="text-xs text-slate-500 block mb-1">Purpose / role</label>
          <input className="input mb-3" placeholder="what this agent does" value={role}
            onChange={(e) => setRole(e.target.value)} />
          <label className="text-xs text-slate-500 block mb-1">Model</label>
          <input className="input mb-3" placeholder="model (leave blank if not set)" value={model}
            onChange={(e) => setModel(e.target.value)} />
          <label className="text-xs text-slate-500 block mb-1">Tools (comma-separated)</label>
          <input className="input mb-3" placeholder="tool one, tool two" value={toolsText}
            onChange={(e) => setToolsText(e.target.value)} />
          <label className="text-xs text-slate-500 block mb-1">Daily spend limit</label>
          <input className="input mb-3" placeholder="daily spend limit (leave blank if not set)" value={spendLimit}
            onChange={(e) => setSpendLimit(e.target.value)} />
          <label className="text-xs text-slate-500 block mb-1">Status</label>
          <select className="input mb-4" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">active</option>
            <option value="paused">paused</option>
          </select>
          <button className="btn-primary" onClick={submit}>Create agent</button>
          {error && <p className="text-xs text-crit mt-3">{error}</p>}
        </Card>

        <Card>
          <SectionTitle title="Registered agents" sub={`${agents.length} total · ${agents.filter((a) => a.status === 'active').length} active`} />
          {agents.length === 0 ? <Empty>No agents yet — create one.</Empty> : (
            <div className="space-y-4">
              {agents.map((a) => {
                const isActive = (a.status || 'active') === 'active';
                const isAetherbot = ((a.name || '').trim().toLowerCase() === 'aetherbot');
                return (
                  <div key={a.id} className="py-2 border-b border-ink-700/40 last:border-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-200 font-mono">{a.name || 'unnamed agent'}</p>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${isActive ? 'border-ok/50 text-ok bg-ok/10' : 'border-med/50 text-med bg-med/10'}`}>
                        {isActive ? 'active' : 'paused'}
                      </span>
                    </div>
                    <dl className="text-xs space-y-1.5 mt-2">
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Role</dt><dd className="text-slate-300 text-right">{displayText(a.role)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Model</dt><dd className="text-slate-300 font-mono text-right">{displayText(a.model)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Tools</dt><dd className="text-slate-300 font-mono text-right">{displayTools(a.tools)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Daily spend limit</dt><dd className="text-slate-300 font-mono text-right">{displayText(a.spendLimit)}</dd></div>
                      {a.repo ? (
                        <div className="flex justify-between gap-3"><dt className="text-slate-500">Repo</dt><dd className="text-slate-300 font-mono text-right">{a.repo}</dd></div>
                      ) : null}
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Created by</dt><dd className="text-slate-300 font-mono text-right">{displayText(a.createdBy)}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Created</dt><dd className="text-slate-300 font-mono text-right">{displayDate(a)}</dd></div>
                    </dl>
                    {isAetherbot && (
                      <p className="text-[11px] text-slate-500 border border-ink-700/50 rounded-lg px-3 py-2 mt-3">
                        Paper-test context (fixture backtest): −8.25 USDT on 10,000 paper USDT.
                      </p>
                    )}
                    <button className="btn-ghost mt-3" onClick={() => toggle(a)}>
                      {isActive ? 'Pause agent' : 'Resume agent'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
