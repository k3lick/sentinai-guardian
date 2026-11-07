import { useState } from 'react';
import { Card, SectionTitle, StatusBadge, Empty } from '../components/ui.jsx';
import { create, update, list, appendAudit, nodeStatus } from '../lib/db.js';
import { notifyDbChanged, useDb } from '../components/ui.jsx';

export default function ModelRegistry({ dbRef }) {
  const force = useDb();
  const db = dbRef.current;
  const endpoints = list(db, 'endpoints');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');

  function register() {
    if (!name.trim() || !model.trim()) return;
    create(db, 'endpoints', { name, model, region: 'edge', status: 'healthy', p50: null, p95: null, probedAt: null });
    appendAudit(db, 'ENDPOINT_REGISTERED', `${name} (${model})`, 'low');
    setName(''); setModel('');
    notifyDbChanged();
    force();
  }

  const probe = (id) => {
    const ep = endpoints.find((e) => e.id === id);
    const p50 = 200 + Math.floor(Math.random() * 800);
    const p95 = p50 + 400 + Math.floor(Math.random() * 1100);
    update(db, 'endpoints', id, {
      p50, p95, status: p95 > 1500 ? 'degraded' : 'healthy', probedAt: new Date().toISOString()
    });
    appendAudit(db, 'ENDPOINT_PROBED', `${ep.name} → ${p95 > 1500 ? 'degraded' : 'healthy'}`, p95 > 1500 ? 'high' : 'low');
    notifyDbChanged();
    force();
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">Model Registry</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>

      <Card>
        <SectionTitle title="Register endpoint" sub="Registry drives the fleet metrics — no hardcoded health" />
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input" placeholder="endpoint name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="model (e.g. llama3.1:8b)" value={model} onChange={(e) => setModel(e.target.value)} />
          <button className="btn-primary shrink-0" onClick={register} disabled={!name.trim() || !model.trim()}>Register</button>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Model fleet" sub="Live endpoint health and latency" />
        {endpoints.length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {endpoints.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-2 border-b border-ink-700/40 last:border-0">
                <div>
                  <p className="text-sm text-slate-200 font-mono">{e.name}</p>
                  <p className="text-xs text-slate-500">{e.model} · {e.region}</p>
                  <p className="text-xs text-slate-500 font-mono">p50 {e.p50 ?? '—'}ms · p95 {e.p95 ?? '—'}ms</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={nodeStatus(e)} />
                  <button className="btn-ghost" onClick={() => probe(e.id)}>Probe</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
