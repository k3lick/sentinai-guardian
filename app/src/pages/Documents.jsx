import { useState } from 'react';
import { Card, SectionTitle, StatusBadge, SeverityBadge, Empty } from '../components/ui.jsx';
import { create, appendAudit, list } from '../lib/db.js';
import { notifyDbChanged, useDb } from '../components/ui.jsx';

const SENSITIVE = [/api[_-]?key/i, /\bpassword\b/i, /\bsecret\b/i, /aws[_-]?credential/i, /private[_-]?key/i, /\bssn\b/i];

function scanDocument(doc) {
  const findings = [];
  SENSITIVE.forEach((re, i) => {
    if (re.test(doc.content)) {
      findings.push({
        severity: i < 3 ? 'critical' : 'high',
        title: `Sensitive pattern: ${re.source}`,
        documentId: doc.id
      });
    }
  });
  return findings;
}

export default function Documents({ dbRef }) {
  const force = useDb();
  const db = dbRef.current;
  const docs = list(db, 'documents');
  const findings = list(db, 'findings');
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState('');

  function ingest() {
    if (!name.trim()) return;
    // Dedupe: a document with the same name (case-insensitive) or the same
    // non-empty content is already in the library — report it instead of
    // adding a second copy.
    const trimmedName = name.trim().toLowerCase();
    const duplicate = docs.find((d) =>
      d.name.trim().toLowerCase() === trimmedName
      || (content.trim() !== '' && d.content === content));
    if (duplicate) {
      setNotice(`"${duplicate.name}" is already in the library — not added again.`);
      setName(''); setContent('');
      return;
    }
    setNotice('');
    const doc = create(db, 'documents', { name, content, status: 'clean' });
    const hits = scanDocument(doc);
    hits.forEach((f) => create(db, 'findings', f));
    const critical = hits.filter((h) => h.severity === 'critical').length;
    if (critical > 0) {
      // eslint-disable-next-line no-unused-vars
      const d = db.documents.find((x) => x.id === doc.id);
      d.status = 'quarantined';
    }
    appendAudit(db, critical ? 'DOC_QUARANTINED' : 'DOC_CLEAN', `${name}: ${hits.length} finding(s)`, critical ? 'high' : 'low');
    setName(''); setContent('');
    notifyDbChanged();
    force();
  }

  const quarantined = docs.filter((d) => d.status === 'quarantined');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">Documents</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle title="Ingest document" sub="Content-based scan — sensitive patterns quarantine automatically" />
          <input className="input mb-3" placeholder="document name (e.g. vendor-runbook.md)" value={name}
            onChange={(e) => setName(e.target.value)} />
          <textarea className="input min-h-[100px] mb-3 font-mono text-xs" placeholder="Paste document content..."
            value={content} onChange={(e) => setContent(e.target.value)} />
          <button className="btn-primary" onClick={ingest} disabled={!name.trim()}>Scan & ingest</button>
          {notice && <p className="text-xs text-ok mt-2">{notice}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <button className="chip" onClick={() => { setName('leaked-credentials.txt'); setContent('AWS_SECRET_ACCESS_KEY=wJalr... password=hunter2 for staging'); }}>
              sample: leaked credentials
            </button>
            <button className="chip" onClick={() => { setName('onboarding.md'); setContent('# Onboarding\nWelcome to the team. No secrets here.'); }}>
              sample: clean doc
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Quarantine" sub={`${quarantined.length} pending review · ${docs.length} total`} />
          {docs.length === 0 ? <Empty>No documents ingested yet.</Empty> : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-ink-700/40 last:border-0">
                  <div>
                    <p className="text-sm text-slate-200 font-mono">{d.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[280px]">{d.content.slice(0, 60)}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionTitle title="Scan findings" sub={`${findings.filter((f) => f.severity === 'critical').length} critical · ${findings.filter((f) => f.severity === 'high').length} high across ${docs.length} document(s)`} />
        {findings.length === 0 ? <Empty>No findings yet — run a scenario or ingest a document.</Empty> : (
          <div className="space-y-2">
            {findings.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-1.5 border-b border-ink-700/40 last:border-0">
                <span className="text-xs text-slate-300 font-mono">{f.title}</span>
                <SeverityBadge level={f.severity} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
