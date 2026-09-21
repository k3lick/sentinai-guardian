import { Activity, ShieldAlert, ScanSearch, Siren } from 'lucide-react';
import { Card, SectionTitle, StatCard, StatusBadge, SeverityBadge, Empty } from '../components/ui.jsx';
import { metrics, list } from '../lib/db.js';

export default function Overview({ db, setPage }) {
  const m = metrics(db);
  const incidents = list(db, 'incidents').filter((i) => i.status !== 'resolved');
  const siem = list(db, 'siemEvents').slice(0, 8);
  const endpoints = list(db, 'endpoints');

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Overview</h1>
          <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
        </div>
        <StatusBadge status={m.degraded ? 'DEGRADED' : 'NOMINAL'} />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Fleet availability"
          value={`${m.fleetAvailability}%`}
          hint={`${m.healthy} healthy · ${m.degraded} degraded · ${m.offline} offline · avg p95 ${m.avgP95}ms`}
          accent={m.fleetAvailability === 100 ? 'text-ok' : 'text-med'} />
        <StatCard icon={ShieldAlert} label="Quarantine volume"
          value={m.quarantine} hint={`${m.docsClean} clean · ${m.docsTotal} total docs`} accent="text-high" />
        <StatCard icon={ScanSearch} label="Scan findings"
          value={m.findings} hint={`${m.critical} critical · ${m.high} high`} accent="text-crit" />
        <StatCard icon={Siren} label="Open incidents"
          value={m.openIncidents} hint={`${m.sev1} SEV-1 · ${incidents.length} total`} accent="text-crit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle title="Guardrail verdicts" sub="Live policy engine — every verdict persisted" />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-2xl font-mono font-bold text-crit">{m.denied}</p><p className="text-xs text-slate-500">denied</p></div>
            <div><p className="text-2xl font-mono font-bold text-med">{m.escalated}</p><p className="text-xs text-slate-500">escalated</p></div>
            <div><p className="text-2xl font-mono font-bold text-ok">{m.allowed}</p><p className="text-xs text-slate-500">allowed</p></div>
          </div>
          <button onClick={() => setPage('guardrails')} className="btn-ghost mt-4">Open guardrails →</button>
        </Card>

        <Card>
          <SectionTitle title="Model fleet health" sub="Derived from live endpoint probes" />
          {endpoints.length === 0 ? <Empty /> : endpoints.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 border-b border-ink-700/40 last:border-0">
              <div>
                <p className="text-sm text-slate-200 font-mono">{e.name}</p>
                <p className="text-xs text-slate-500">{e.model} · {e.region}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 font-mono">p50 {e.p50 ?? '—'} · p95 {e.p95 ?? '—'}</p>
                <StatusBadge status={e.status} />
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Live activity stream" sub="SIEM events in real time" />
        {siem.length === 0 ? <Empty>No events yet — run a guardrail evaluation.</Empty> : (
          <div className="space-y-2">
            {siem.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-ink-700/40 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[10px] font-bold ${ev.type.includes('DENY') ? 'text-crit' : ev.type.includes('HUMAN') ? 'text-med' : 'text-ok'}`}>
                    {ev.type}
                  </span>
                  <span className="text-xs text-slate-400 truncate">{ev.message}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SeverityBadge level={ev.severity} />
                  <span className="text-[10px] text-slate-600 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
