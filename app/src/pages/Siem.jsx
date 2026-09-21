import { useState } from 'react';
import { Card, SectionTitle, SeverityBadge, Empty } from '../components/ui.jsx';
import { list } from '../lib/db.js';
import { useDb } from '../components/ui.jsx';

const EVENT_KEYS = {
  'GUARDRAIL_DENY': true, 'GUARDRAIL_HUMAN': true, 'GUARDRAIL_ALLOW': true,
  'POLICY_DENY': true, 'POLICY_HUMAN': true, 'POLICY_ALLOW': true,
  'ENDPOINT_PROBED': true, 'ENDPOINT_REGISTERED': true,
  'DOC_QUARANTINED': true, 'DOC_CLEAN': true,
  'INCIDENT_OPENED': true, 'INCIDENT_RESOLVED': true, 'ENDPOINTS_BULK_CATEGORIZED': true
};

export default function Siem({ dbRef }) {
  const force = useDb();
  const db = dbRef.current;
  const events = list(db, 'siemEvents');
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? events : events.filter((e) => e.type.includes(filter));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">SIEM Streaming</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>

      <Card>
        <SectionTitle title="Event stream" sub={`${events.length} events · export-ready schema`} />
        <div className="flex gap-2 mb-4">
          {['all', 'DENY', 'HUMAN', 'ALLOW'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-lg border transition ${filter === f ? 'border-ok text-ok bg-ok/10' : 'border-ink-600 text-slate-400'}`}>
              {f}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? <Empty>No SIEM events yet.</Empty> : (
          <div className="space-y-1.5">
            {filtered.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-ink-700/40 last:border-0 font-mono text-xs">
                <span className={ev.type.includes('DENY') ? 'text-crit' : ev.type.includes('HUMAN') ? 'text-med' : 'text-ok'}>
                  {ev.type}
                </span>
                <span className="text-slate-400 truncate flex-1">{ev.message}</span>
                <SeverityBadge level={ev.severity} />
                <span className="text-slate-600 shrink-0">{new Date(ev.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 border-t border-ink-700/50 pt-3">
          <button className="btn-ghost" onClick={() => {
            const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'sentinai-siem-export.json';
            a.click();
          }}>Export NDJSON</button>
          <span className="text-[10px] text-slate-600 ml-3">{Object.keys(EVENT_KEYS).length} event types recognized</span>
        </div>
      </Card>
    </div>
  );
}
