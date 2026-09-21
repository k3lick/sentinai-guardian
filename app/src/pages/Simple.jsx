import { Card, SectionTitle, Empty } from '../components/ui.jsx';
import { list, metrics } from '../lib/db.js';

/**
 * Lighter sections that still read real data: Orchestration, SLA & Escalation,
 * Approvals & SoD, Governance, Compliance, Settings.
 */
export default function Simple({ dbRef, page }) {
  const db = dbRef.current;
  const m = metrics(db);

  const bodies = {
    orchestration: () => (
      <>
        <SectionTitle title="Orchestration console" sub="Endpoint routing and bulk categorization" />
        {list(db, 'endpoints').map((e) => (
          <p key={e.id} className="text-xs font-mono text-slate-400 py-1 border-b border-ink-700/40">
            route: acme-core/{e.region} → {e.name} ({e.model})
          </p>
        ))}
      </>
    ),
    sla: () => (
      <>
        <SectionTitle title="SLA & Escalation" sub="Policy: SEV-1 ack 15m / resolve 4h · SEV-2 ack 1h" />
        <p className="text-xs text-slate-400">
          {m.openIncidents} open incident(s) currently tracked. Escalation ladder: on-call → shift lead → CISO.
        </p>
      </>
    ),
    approvals: () => (
      <>
        <SectionTitle title="Approvals & Separation of Duties" sub="Every 'human' verdict lands here" />
        {m.escalated === 0 ? <Empty>No approvals pending.</Empty> : (
          <p className="text-xs text-slate-400">{m.escalated} verdict(s) awaiting human approval. SoD: requester ≠ approver enforced.</p>
        )}
      </>
    ),
    governance: () => (
      <>
        <SectionTitle title="Governance" sub="Tenant, retention, and policy ownership" />
        <p className="text-xs text-slate-400">Tenant: acme-core · retention: 400 days · policy owner: platform-security@</p>
        <p className="text-xs text-slate-400 mt-2">Audit chain integrity: {m.chainIntact ? 'verified' : 'tamper'}</p>
      </>
    ),
    compliance: () => (
      <>
        <SectionTitle title="Compliance" sub="Evidence packs generated from live records" />
        <div className="space-y-1 text-xs text-slate-400">
          <p>SOC 2 CC7.2 — guardrail decisions: {m.denied + m.escalated + m.allowed} records</p>
          <p>ISO 27001 A.12.4 — audit chain: {list(db, 'auditLog').length} records</p>
          <p>GDPR Art. 32 — quarantined PII docs: {m.quarantine}</p>
        </div>
      </>
    ),
    settings: () => (
      <>
        <SectionTitle title="Settings" sub="Local instance configuration" />
        <div className="space-y-1 text-xs text-slate-400">
          <p>Storage adapter: localStorage (swap in lib/db.js for REST)</p>
          <p>Verification code flow: simulated in dev banner</p>
          <p>Reset demo data: run `localStorage.clear()` and reload</p>
        </div>
      </>
    )
  };

  const titles = {
    orchestration: 'Orchestration', sla: 'SLA & Escalation', approvals: 'Approvals & SoD',
    governance: 'Governance', compliance: 'Compliance', settings: 'Settings'
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">{titles[page]}</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>
      <Card>{(bodies[page] || (() => <Empty />))()}</Card>
    </div>
  );
}
