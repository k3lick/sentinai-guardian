import { Card, SectionTitle, SeverityBadge, Empty } from '../components/ui.jsx';
import { list, metrics } from '../lib/db.js';
import { verifyChain } from '../lib/db.js';

export default function AuditLog({ dbRef }) {
  const db = dbRef.current;
  const log = list(db, 'auditLog');
  const m = metrics(db);
  const intact = verifyChain(log);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-50">Audit Log</h1>
          <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
        </div>
        <span className={`text-[10px] font-mono px-2 py-1 rounded border ${intact ? 'border-ok/50 text-ok' : 'border-crit/50 text-crit'}`}>
          CHAIN {intact ? 'VERIFIED' : 'BROKEN'}
        </span>
      </header>

      <Card>
        <SectionTitle title={`${log.length} immutable records`} sub="Tamper-evident chain — each record hashes the previous" />
        {log.length === 0 ? <Empty /> : (
          <div className="space-y-2">
            {log.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between gap-3 py-2 border-b border-ink-700/40 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">{rec.type}</span>
                  <span className="text-xs text-slate-300 truncate">{rec.message}</span>
                  <span className="text-[10px] font-mono text-slate-600 shrink-0">#{rec.hash.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SeverityBadge level={rec.severity} />
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-600 mt-3">
          chain integrity: {intact ? 'ok' : 'tampered'} · {m.denied} denies · {m.escalated} escalations on record
        </p>
      </Card>
    </div>
  );
}
