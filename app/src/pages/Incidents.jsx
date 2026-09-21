import { useState } from 'react';
import { Card, SectionTitle, SeverityBadge, Empty } from '../components/ui.jsx';
import { create, update, list, appendAudit } from '../lib/db.js';
import { notifyDbChanged, useDb } from '../components/ui.jsx';

export default function Incidents({ dbRef }) {
  const force = useDb();
  const db = dbRef.current;
  const incidents = list(db, 'incidents');
  const [sev, setSev] = useState('SEV-2');
  const [title, setTitle] = useState('');

  function openIncident() {
    if (!title.trim()) return;
    create(db, 'incidents', { sev, title, status: 'open', sla: { ack: '15m', resolve: sev === 'SEV-1' ? '4h' : '24h' } });
    appendAudit(db, 'INCIDENT_OPENED', `${sev}: ${title}`, sev === 'SEV-1' ? 'critical' : 'high');
    setTitle('');
    notifyDbChanged();
    force();
  }

  const resolve = (id) => {
    update(db, 'incidents', id, { status: 'resolved', resolvedAt: new Date().toISOString() });
    appendAudit(db, 'INCIDENT_RESOLVED', `Incident ${id.slice(0, 6)} resolved`, 'low');
    notifyDbChanged();
    force();
  };

  const open = incidents.filter((i) => i.status !== 'resolved');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">Incidents</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>

      <Card>
        <SectionTitle title="Declare incident" sub="Counts feed the Overview metrics immediately" />
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={sev} onChange={(e) => setSev(e.target.value)} className="input sm:w-32">
            {['SEV-1', 'SEV-2', 'SEV-3'].map((s) => <option key={s}>{s}</option>)}
          </select>
          <input className="input" placeholder="Incident title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="btn-primary shrink-0" onClick={openIncident} disabled={!title.trim()}>Declare</button>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Active incidents" sub={`${open.filter((i) => i.sev === 'SEV-1').length} SEV-1 · ${open.length} open · ${incidents.length} total`} />
        {incidents.length === 0 ? <Empty>No incidents — quiet day in the SOC.</Empty> : (
          <div className="space-y-2">
            {incidents.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 py-2 border-b border-ink-700/40 last:border-0">
                <div>
                  <p className="text-sm text-slate-200">{i.title}</p>
                  <p className="text-xs text-slate-500">{i.sev} · ack {i.sla?.ack} · resolve {i.sla?.resolve}</p>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge level={i.sev === 'SEV-1' ? 'critical' : i.sev === 'SEV-2' ? 'high' : 'medium'} />
                  {i.status !== 'resolved' ? (
                    <button className="btn-ghost" onClick={() => resolve(i.id)}>Resolve</button>
                  ) : (
                    <span className="text-[10px] text-ok font-mono">RESOLVED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
