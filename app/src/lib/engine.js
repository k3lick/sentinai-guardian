/**
 * SentinAI Guardrail / Policy Engine
 * ----------------------------------
 * Real content-based verdicts. This is the logic that was verified live in the
 * Base44 app: destructive SQL is DENIED (DB-001), bulk exports escalate to a
 * human (DB-020), benign reads are ALLOWED (DB-000), and prompt-injection
 * attempts are DENIED (PR-001).
 *
 * Every verdict returned by `evaluate()` is meant to be persisted:
 *   - a PolicyDecision record
 *   - a SIEM event
 *   - an AuditLog entry (hash-chained by the persistence layer)
 */

const DESTRUCTIVE = [
  /\bdrop\s+(table|database|schema|index|view)\b/i,
  /\btruncate\s+table\b/i,
  /\balter\s+table\b.*\b(drop|rename)\b/i,
  /\bdelete\s+from\b/i,
  /\binsert\s+into\b/i,
  /\bupdate\s+\w+\s+set\b/i,
  /\bgrant\s+\w+\s+on\b/i,
  /\bcreate\s+(user|role)\b/i
];

// projections that look like PII exfiltration when paired with bulk volume
const PII_PROJECTION = /\bselect\b[^;]*\b(email|ssn|phone|address|password|token|credit)\b/i;
const BULK_VOLUME = /limit\s+(\d{4,})/i;
const CRM_BULK = /(select\s+\*|export).*(crm|contacts|customers)/i;
const FLEET_SENSITIVE = /select\s+\*.*\b(users|accounts|credentials)\b/i;

const PROMPT_INJECTION = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior)/i,
  /reveal|show|print|output\b[^.]{0,30}\b(system\s*prompt|hidden\s*prompt|instructions)/i,
  /you\s+are\s+now/i,
  /\bjailbreak\b/i,
  /\bdeveloper\s+mode\b/i
];

export const RULES = {
  DB_001: { code: 'DB-001', label: 'Destructive statement blocked', verdict: 'deny', severity: 'high', tool: ['Database query', 'CRM export'] },
  DB_020: { code: 'DB-020', label: 'Bulk exfiltration risk', verdict: 'human', severity: 'medium', tool: ['CRM export', 'Database query'] },
  DB_000: { code: 'DB-000', label: 'Read-only query', verdict: 'allow', severity: 'low', tool: ['Database query', 'CRM export'] },
  DB_030: { code: 'DB-030', label: 'PII projection without explicit limit', verdict: 'human', severity: 'medium', tool: ['Database query', 'CRM export'] },
  PR_001: { code: 'PR-001', label: 'Prompt injection attempt blocked', verdict: 'deny', severity: 'high', tool: ['Prompt'] }
};

/**
 * @param {string} statement
 * @param {string} tool  'Database query' | 'CRM export' | 'Prompt'
 * @returns {{verdict:'allow'|'deny'|'human', rule:string, severity:string, ruleCode:string, statement:string, tool:string}}
 */
export function evaluate(statement, tool = 'Database query') {
  const stmt = (statement || '').trim();

  if (tool === 'Prompt') {
    const injection = PROMPT_INJECTION.some((re) => re.test(stmt));
    const r = injection ? RULES.PR_001 : null;
    if (r) return verdictOf(r, stmt, tool);
    return {
      verdict: 'allow', rule: 'PR-000 · No injection pattern detected',
      ruleCode: 'PR-000', severity: 'low', statement: stmt, tool
    };
  }

  if (DESTRUCTIVE.some((re) => re.test(stmt))) {
    return verdictOf(RULES.DB_001, stmt, tool);
  }

  // bulk exfiltration: explicit big limit on PII-ish projection, or CRM bulk
  const bulk = stmt.match(BULK_VOLUME);
  if ((bulk && Number(bulk[1]) >= 10000 && (PII_PROJECTION.test(stmt) || CRM_BULK.test(stmt)))
      || CRM_BULK.test(stmt)) {
    return verdictOf(RULES.DB_020, stmt, tool);
  }

  // PII projection without a bounded limit -> human review
  if (PII_PROJECTION.test(stmt) && !/\blimit\b/i.test(stmt)) {
    return verdictOf(RULES.DB_030, stmt, tool);
  }

  if (/^\s*(select|with|explain|show)\b/i.test(stmt)) {
    return verdictOf(RULES.DB_000, stmt, tool);
  }

  // unknown / non-read statements are never silently allowed — escalate
  return {
    verdict: 'human',
    rule: 'DB-900 · Unrecognized statement — manual review required',
    ruleCode: 'DB-900', severity: 'medium', statement: stmt, tool
  };
}

function verdictOf(rule, statement, tool) {
  return {
    verdict: rule.verdict,
    rule: `${rule.code} · ${rule.label}`,
    ruleCode: rule.code,
    severity: rule.severity,
    statement,
    tool
  };
}

/** Convenience for the live feed */
export function siemEventFor(v) {
  const type =
    v.verdict === 'deny' ? 'GUARDRAIL_DENY' :
    v.verdict === 'human' ? 'GUARDRAIL_HUMAN' : 'GUARDRAIL_ALLOW';
  return { type, rule: v.rule, tool: v.tool, severity: v.severity };
}
