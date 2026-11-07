import { useState } from 'react';
import { Card, SectionTitle, Empty, SeverityBadge, StatusBadge, notifyDbChanged, useDb } from '../components/ui.jsx';
import { list, metrics, decideVerdict, nodeStatus, SLA, slaFor, ESCALATION_LADDER, TENANT, POLICY_OWNER } from '../lib/db.js';
import { RULES } from '../lib/engine.js';

/**
 * Lighter sections that still read real data: Orchestration, SLA & Escalation,
 * Approvals & SoD, Governance, Compliance, Settings.
 *
 * Approvals: pending "human" verdicts render as actionable items. Approving
 * or rejecting records the decision with the signed-in GitHub user as
 * approver, enforces separation of duties (requester ≠ approver), and
 * writes the decision to the audit log and SIEM stream.
 */
export default function Simple({ dbRef, page, user }) {
  const force = useDb();
  const db = dbRef.current;
  const m = metrics(db);
  const [decisionError, setDecisionError] = useState('');

  function decide(id, decision) {
    setDecisionError('');
    const res = decideVerdict(db, id, decision, user?.login || 'unknown');
    if (!res.ok) return setDecisionError(res.error);
    notifyDbChanged();
    force();
  }

  const pendingApprovals = list(db, 'policyDecisions')
    .filter((d) => d.verdict === 'human' && d.status === 'pending');
  const decidedApprovals = list(db, 'policyDecisions')
    .filter((d) => d.verdict === 'human' && d.status !== 'pending');
  const openIncidents = list(db, 'incidents').filter((i) => i.status !== 'resolved');

  const bodies = {
    orchestration: () => (
      <>
        <SectionTitle title="Orchestration console" sub="Endpoint routing and bulk categorization" />
        <p className="text-xs text-slate-400 mb-3">
          {list(db, 'endpoints').length} route(s) · {m.healthy} healthy · {m.degraded} degraded · {m.offline} offline · tenant {TENANT}
        </p>
        {list(db, 'endpoints').map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 py-2 border-b border-ink-700/40 last:border-0">
            <div>
              <p className="text-xs font-mono text-slate-300">route: {TENANT}/{e.region} → {e.name} ({e.model})</p>
              <p className="text-xs text-slate-500 font-mono">p50 {e.p50 ?? '—'}ms · p95 {e.p95 ?? '—'}ms · probed {e.probedAt ? new Date(e.probedAt).toLocaleTimeString() : 'never'}</p>
            </div>
            <StatusBadge status={nodeStatus(e)} />
          </div>
        ))}
      </>
    ),
    sla: () => (
      <>
        <SectionTitle title="SLA & Escalation" sub="Targets from the shared SLA table — identical on the Incidents page" />
        <div className="space-y-1.5 text-xs mb-4">
          {Object.entries(SLA).map(([sev, t]) => (
            <p key={sev} className="flex justify-between border-b border-ink-700/40 pb-1.5">
              <span className="font-mono text-slate-200">{sev}</span>
              <span className="text-slate-400 font-mono">ack {t.ack} · resolve {t.resolve}</span>
            </p>
          ))}
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Escalation ladder: {ESCALATION_LADDER.join(' → ')}. Breach pages the next rung automatically.
        </p>
        <SectionTitle title="Open incidents — SLA clocks" sub={`${openIncidents.length} open`} />
        {openIncidents.length === 0 ? <Empty>No open incidents — all SLA clocks clear.</Empty> : (
          <div className="space-y-1.5 text-xs">
            {openIncidents.map((i) => (
              <p key={i.id} className="flex justify-between border-b border-ink-700/40 pb-1.5">
                <span className="text-slate-300">{i.title}</span>
                <span className="text-slate-400 font-mono">{i.sev} · ack {slaFor(i.sev).ack} · resolve {slaFor(i.sev).resolve}</span>
              </p>
            ))}
          </div>
        )}
      </>
    ),
    approvals: () => (
      <>
        <SectionTitle title="Approvals & Separation of Duties" sub="Every 'human' verdict lands here — requester ≠ approver enforced" />
        {decisionError && <p className="text-xs text-crit mb-3">{decisionError}</p>}
        {pendingApprovals.length === 0 ? <Empty>No approvals pending.</Empty> : (
          <div className="space-y-3">
            {pendingApprovals.map((d) => (
              <div key={d.id} className="border border-med/40 rounded-lg p-3">
                <p className="text-xs font-mono text-slate-200 truncate">{d.statement}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                  <span>{d.tool} · {d.rule}</span>
                  <SeverityBadge level={d.severity} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Requested by {d.requester} · {new Date(d.timestamp).toLocaleString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <button className="btn-primary" onClick={() => decide(d.id, 'approved')}>Approve</button>
                  <button className="btn-ghost" onClick={() => decide(d.id, 'rejected')}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {decidedApprovals.length > 0 && (
          <div className="mt-4">
            <SectionTitle title="Decided" sub="Decisions are written to the audit log and SIEM stream" />
            <div className="space-y-1.5 text-xs">
              {decidedApprovals.map((d) => (
                <p key={d.id} className="flex flex-wrap justify-between gap-2 border-b border-ink-700/40 pb-1.5">
                  <span className="text-slate-300 font-mono truncate max-w-[60%]">{d.statement}</span>
                  <span className={d.status === 'approved' ? 'text-ok' : 'text-crit'}>
                    {(d.status || 'pending').toUpperCase()} by {d.decidedBy || '—'}
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}
      </>
    ),
    governance: () => (
      <>
        <SectionTitle title="Governance" sub="Tenant, retention, and policy ownership" />
        <div className="space-y-1.5 text-xs text-slate-400 mb-4">
          <p>Tenant: {TENANT} · retention: 400 days · policy owner: {POLICY_OWNER}</p>
          <p>Audit chain integrity: {m.chainIntact ? 'verified' : 'tamper'}</p>
        </div>
        <SectionTitle title="Active guardrail policies" sub={`${Object.keys(RULES).length} rules enforced by the policy engine`} />
        <div className="space-y-1.5 text-xs">
          {Object.values(RULES).map((r) => (
            <p key={r.code} className="flex flex-wrap justify-between gap-2 border-b border-ink-700/40 pb-1.5">
              <span className="text-slate-300 font-mono">{r.code} · {r.label}</span>
              <span className="text-slate-500">{r.verdict.toUpperCase()} · {r.severity}</span>
            </p>
          ))}
        </div>
      </>
    ),
    compliance: () => (
      <>
        <SectionTitle title="Compliance" sub="Evidence packs generated from live records" />
        <div className="space-y-1.5 text-xs text-slate-400">
          <p>SOC 2 CC7.2 — guardrail decisions: {m.denied + m.escalated + m.allowed} records</p>
          <p>ISO 27001 A.12.4 — audit chain: {list(db, 'auditLog').length} records</p>
          <p>GDPR Art. 32 — quarantined PII docs: {m.quarantine}</p>
          <p>EU AI Act Art. 9 — risk management: {m.denied + m.escalated + m.allowed} evaluated actions, {m.denied} denied</p>
          <p>EU AI Act Art. 14 — human oversight: {pendingApprovals.length} pending · {decidedApprovals.length} decided</p>
          <p>NIST AI RMF — Govern / Map / Measure / Manage: {list(db, 'auditLog').length} audit records, chain {m.chainIntact ? 'verified' : 'tampered'}</p>
        </div>
      </>
    ),
    settings: () => (
      <>
        <SectionTitle title="Settings" sub="Local instance configuration" />
        <div className="space-y-1 text-xs text-slate-400">
          <p>Storage adapter: localStorage (swap in lib/db.js for REST)</p>
          <p>Sign-in: GitHub only (device flow via the sentinai-auth relay). No passwords are stored; the token stays in this browser.</p>
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
        <p className="text-xs text-slate-500">tenant: {TENANT} · region: on-prem</p>
      </header>
      <Card>{(bodies[page] || (() => <Empty />))()}</Card>
    </div>
  );
}
