/**
 * SentinAI persistence layer
 * --------------------------
 * Entity-shaped storage (mirrors the Base44 entity model of the live app) with
 * a localStorage adapter by default. Swap `adapter` for a REST client to point
 * the app at a real backend — the rest of the code only talks to `db`.
 *
 * Collections: endpoints, documents, findings, incidents, policyDecisions,
 *              siemEvents, auditLog, users, session
 *
 * Audit records are hash-chained for tamper evidence (see appendAudit).
 */

import { evaluate, siemEventFor } from './engine.js';

const KEY = 'sentinai.db.v1';

// --- shared tenant + policy constants (single source of truth) --------------
export const TENANT = 'acme-core';
export const POLICY_OWNER = 'platform-security@acme-core.example';

// SLA targets. Defined here once; the SLA page, the Incidents page and the
// seed all render from this table, so ack/resolve can never disagree.
//   SEV-1: ack 15m / resolve 4h · SEV-2: ack 1h / resolve 24h · SEV-3: ack 4h / resolve 72h
export const SLA = {
  'SEV-1': { ack: '15m', resolve: '4h' },
  'SEV-2': { ack: '1h', resolve: '24h' },
  'SEV-3': { ack: '4h', resolve: '72h' }
};

export const ESCALATION_LADDER = ['on-call', 'shift lead', 'CISO'];

// Node health: the stored status is the truth. Overview, Model Registry and
// metrics all derive through this helper — never recompute per page (an
// unprobed node is NOT offline; it keeps its registered status until probed).
export function nodeStatus(e) { return e.status; }

let adapter = {
  read: () => JSON.parse(localStorage.getItem(KEY) || 'null'),
  write: (db) => localStorage.setItem(KEY, JSON.stringify(db))
};

export function setAdapter(next) { adapter = next; }

export const uuid = () =>
  'xxxxxxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)) + Date.now().toString(16).slice(-6);

// --- tamper-evident audit chain --------------------------------------------
// FNV-1a over (prevHash + timestamp + type + message). Good enough to demo
// chain verification; swap for SHA-256 (crypto.subtle) in production.
export function chainHash(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8) + '-' + input.length.toString(16);
}

// records are stored newest-first; the chain must be walked oldest-first
export function verifyChain(log) {
  let prev = 'GENESIS';
  return [...log].reverse().every((rec) => {
    const expect = chainHash(prev + rec.timestamp + rec.type + rec.message);
    if (expect !== rec.hash) return false;
    prev = rec.hash;
    return true;
  });
}

// --- core -------------------------------------------------------------------
export function load() {
  let db = adapter.read();
  if (!db) { db = seed(); adapter.write(db); }
  return db;
}

export function save(db) { adapter.write(db); }

export function list(db, coll) { return db[coll] || []; }

export function create(db, coll, record) {
  const rec = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    ...record
  };
  db[coll] = [rec, ...(db[coll] || [])];
  save(db);
  return rec;
}

export function update(db, coll, id, patch) {
  const rec = (db[coll] || []).find((r) => r.id === id);
  if (!rec) return null;
  Object.assign(rec, patch);
  save(db);
  return rec;
}

export function remove(db, coll, id) {
  db[coll] = (db[coll] || []).filter((r) => r.id !== id);
  save(db);
}

// The single write path for every guardrail verdict — this is what makes the
// app "compliance-first": one evaluation fans out to decision + SIEM + audit.
// `requester` is who asked for the action (a GitHub login for live runs, an
// agent identity for seeded history). Human verdicts start as pending
// approvals; allow/deny verdicts need no human action.
export function recordVerdict(db, v, requester) {
  const decision = create(db, 'policyDecisions', {
    verdict: v.verdict, rule: v.rule, tool: v.tool,
    severity: v.severity, statement: v.statement,
    requester: requester || 'system@acme-core.example',
    status: v.verdict === 'human' ? 'pending' : 'decided'
  });
  const ev = siemEventFor(v);
  create(db, 'siemEvents', {
    type: ev.type, message: `${v.tool}: ${v.rule}`, severity: ev.severity
  });
  appendAudit(db, `POLICY_${v.verdict === 'deny' ? 'DENY' : v.verdict === 'human' ? 'HUMAN' : 'ALLOW'}`,
    `${v.tool}: ${v.rule}`, v.severity);
  return decision;
}

// Decide a pending human verdict. Enforces separation of duties: the
// requester can never approve or reject their own request. A decision
// updates the record, writes a SIEM event and an audit-log entry, so the
// decision shows up in the Audit Log and the SIEM stream.
export function decideVerdict(db, id, decision, approver) {
  const rec = (db.policyDecisions || []).find((r) => r.id === id);
  if (!rec) return { ok: false, error: 'Approval item not found.' };
  if (rec.verdict !== 'human' || rec.status !== 'pending') {
    return { ok: false, error: 'This verdict is no longer pending.' };
  }
  if (rec.requester && approver
      && rec.requester.toLowerCase() === approver.toLowerCase()) {
    return { ok: false, error: 'Separation of duties: the requester cannot approve their own request.' };
  }
  rec.status = decision; // 'approved' | 'rejected'
  rec.decidedBy = approver || 'unknown';
  rec.decidedAt = new Date().toISOString();
  save(db);
  create(db, 'siemEvents', {
    type: decision === 'approved' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
    message: `${rec.decidedBy}: ${rec.rule} (${rec.tool})`,
    severity: 'medium'
  });
  appendAudit(db, decision === 'approved' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
    `${rec.decidedBy} ${decision} ${rec.rule} — requested by ${rec.requester}`, 'medium');
  return { ok: true };
}

export function appendAudit(db, type, message, severity = 'medium') {
  const log = db.auditLog || [];
  const prev = log.length ? log[0].hash : 'GENESIS'; // log is newest-first
  const ts = new Date().toISOString();
  const rec = {
    id: uuid(),
    timestamp: ts,
    type, message, severity,
    hash: chainHash(prev + ts + type + message)
  };
  db.auditLog = [rec, ...log];
  save(db);
  return rec;
}

// --- metrics: always computed, never hardcoded ------------------------------
export function metrics(db) {
  const endpoints = list(db, 'endpoints');
  const healthy = endpoints.filter((e) => nodeStatus(e) === 'healthy').length;
  const degraded = endpoints.filter((e) => nodeStatus(e) === 'degraded').length;
  const offline = endpoints.filter((e) => nodeStatus(e) === 'offline').length;
  const probed = endpoints.filter((e) => e.p95 != null);
  const avgP95 = probed.length ? Math.round(probed.reduce((s, e) => s + e.p95, 0) / probed.length) : 0;

  const docs = list(db, 'documents');
  const quarantined = docs.filter((d) => d.status === 'quarantined');

  const findings = list(db, 'findings');
  const incidents = list(db, 'incidents');
  const decisions = list(db, 'policyDecisions');

  const sev = (arr, s) => arr.filter((x) => x.severity === s).length;

  return {
    fleetAvailability: endpoints.length ? Math.round((healthy / endpoints.length) * 100) : 0,
    healthy, degraded, offline, avgP95,
    quarantine: quarantined.length,
    docsClean: docs.length - quarantined.length,
    docsTotal: docs.length,
    findings: findings.length,
    critical: sev(findings, 'critical'),
    high: sev(findings, 'high'),
    openIncidents: incidents.filter((i) => i.status !== 'resolved').length,
    sev1: incidents.filter((i) => i.sev === 'SEV-1' && i.status !== 'resolved').length,
    denied: decisions.filter((d) => d.verdict === 'deny').length,
    escalated: decisions.filter((d) => d.verdict === 'human' && d.status === 'pending').length,
    allowed: decisions.filter((d) => d.verdict === 'allow').length,
    chainIntact: verifyChain(list(db, 'auditLog'))
  };
}

// --- seed -------------------------------------------------------------------
function seed() {
  const db = {
    endpoints: [
      { id: uuid(), name: 'test-node-b', model: 'test-model', region: 'edge', status: 'degraded', p50: 854, p95: 1720, probedAt: new Date().toISOString() },
      { id: uuid(), name: 'test-node-a', model: 'test-model', region: 'edge', status: 'healthy', p50: null, p95: null, probedAt: null }
    ],
    documents: [],
    findings: [],
    incidents: [],
    policyDecisions: [],
    siemEvents: [],
    auditLog: [],
    users: [],
    session: null
  };

  // seed history the same way the live app did — through the real engine.
  // Requesters are agent identities, never a signed-in user, so the seeded
  // escalated verdict can actually be approved (separation of duties).
  const history = [
    { stmt: 'DROP TABLE customers;', tool: 'Database query', requester: 'db-query-agent@acme-core.example' },
    { stmt: 'SELECT * FROM crm.contacts LIMIT 50000;', tool: 'CRM export', requester: 'crm-export-agent@acme-core.example' },
    { stmt: 'SELECT name, email FROM users LIMIT 50;', tool: 'Database query', requester: 'db-query-agent@acme-core.example' }
  ];
  history.forEach(({ stmt, tool, requester }) => recordVerdict(db, evaluate(stmt, tool), requester));

  appendAudit(db, 'ENDPOINT_PROBED', 'test-node-b → degraded', 'high');
  appendAudit(db, 'ENDPOINTS_BULK_CATEGORIZED', '2 endpoints · category', 'medium');
  return db;
}


