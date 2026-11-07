import { Card, SectionTitle } from '../components/ui.jsx';

// User Guide — the full manual for SentinAI, in one scrollable page.
// Every section describes a feature that actually exists in the app.
// Section ids match the table of contents anchors below.

const TOC = [
  { id: 'what-is', label: '1. What SentinAI is' },
  { id: 'sign-in', label: '2. Signing in' },
  { id: 'overview', label: '3. The Overview dashboard' },
  { id: 'agents', label: '4. Agents' },
  { id: 'registry', label: '5. Model Registry' },
  { id: 'guardrails', label: '6. Guardrails' },
  { id: 'documents', label: '7. Documents' },
  { id: 'incidents', label: '8. Incidents' },
  { id: 'approvals', label: '9. Approvals & separation of duties' },
  { id: 'audit-log', label: '10. Audit Log' },
  { id: 'siem', label: '11. SIEM Streaming' },
  { id: 'admin-pages', label: '12. SLA & Escalation, Governance, Compliance, Settings' },
  { id: 'data-privacy', label: '13. Data & privacy' },
  { id: 'troubleshooting', label: '14. Troubleshooting' }
];

function GuideSection({ id, title, children }) {
  return (
    <Card>
      <h2 id={id} className="text-base font-semibold text-slate-100 scroll-mt-6">{title}</h2>
      <div className="mt-3 space-y-3 text-sm text-slate-400 leading-relaxed">
        {children}
      </div>
    </Card>
  );
}

function Mono({ children }) {
  return <code className="font-mono text-xs text-slate-200 bg-ink-900 border border-ink-700/50 rounded px-1.5 py-0.5">{children}</code>;
}

export default function UserGuide() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-50">User Guide</h1>
        <p className="text-xs text-slate-500">tenant: acme-core · region: on-prem</p>
      </header>

      <Card>
        <SectionTitle title="Contents" sub="Jump to a section — everything below describes the app as it is" />
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {TOC.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="text-sm text-ok hover:underline">{item.label}</a>
            </li>
          ))}
        </ol>
      </Card>

      <GuideSection id="what-is" title="1. What SentinAI is">
        <p>
          SentinAI is a security control room for autonomous AI agents. It watches what your agents
          try to do, checks every action against a set of guardrail rules before it goes ahead, and
          keeps a tamper-evident record of every decision.
        </p>
        <p>
          It is for the people responsible for agents running in production: security analysts,
          platform engineers and team leads who need to answer three questions at any moment —
          what are my agents doing, what has been blocked, and who approved what.
        </p>
        <p>What it watches:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">Tool calls</span> — database queries, CRM exports and prompts your agents make.</li>
          <li><span className="text-slate-200">Documents</span> — files agents handle, scanned for secrets and sensitive data.</li>
          <li><span className="text-slate-200">Model endpoints</span> — the nodes your agents run on, and whether they are healthy.</li>
          <li><span className="text-slate-200">Incidents</span> — things that go wrong, tracked against response-time targets.</li>
        </ul>
        <p>
          Why it matters: an autonomous agent can issue a destructive database command or export
          thousands of customer records in seconds. SentinAI puts a policy check in front of those
          actions, so dangerous ones are denied outright, risky ones wait for a human, and everything
          is logged where it can be audited later.
        </p>
      </GuideSection>

      <GuideSection id="sign-in" title="2. Signing in">
        <p>
          SentinAI signs you in with GitHub only. There is no username and password for SentinAI
          itself, and no password is ever stored.
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click <span className="text-slate-200">Continue with GitHub</span> on the sign-in screen.</li>
          <li>A code appears on screen. Click <span className="text-slate-200">Open github.com/login/device</span> (or go to <Mono>github.com/login/device</Mono> yourself) and type the code in there.</li>
          <li>On GitHub, approve the <span className="text-slate-200">SentinAI Guardian</span> app. The code is valid for about 15 minutes.</li>
          <li>SentinAI picks up the approval automatically and takes you to the Overview dashboard.</li>
        </ol>
        <p>
          Your sign-in token stays in this browser only (in local storage). It is not sent to any
          other service, and nobody else can use your session from another computer.
        </p>
        <p>
          To sign out, click <span className="text-slate-200">Log out</span> at the bottom of the
          sidebar. That clears your session from this browser; signing in again starts a fresh
          GitHub device flow.
        </p>
      </GuideSection>

      <GuideSection id="overview" title="3. The Overview dashboard">
        <p>
          Overview is the first page after sign-in. It is a summary of the whole system — every
          number on it is computed live from the stored records, never typed in by hand.
        </p>
        <p>
          The badge at the top right reads <Mono>NOMINAL</Mono> when no endpoint is degraded, and{' '}
          <Mono>DEGRADED</Mono> when at least one is.
        </p>
        <p>The five headline cards:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">Fleet availability</span> — the percentage of registered model endpoints currently healthy, with a breakdown of healthy, degraded and offline nodes and the average p95 latency.</li>
          <li><span className="text-slate-200">Agents</span> — how many agents are registered, and how many of them are active (not paused).</li>
          <li><span className="text-slate-200">Quarantine volume</span> — documents held in quarantine after a scan found sensitive content, out of the total documents ingested.</li>
          <li><span className="text-slate-200">Scan findings</span> — findings from document scans, with the count of critical and high ones.</li>
          <li><span className="text-slate-200">Open incidents</span> — incidents that are not yet resolved, with the count of open SEV-1 incidents.</li>
        </ul>
        <p>Below the cards:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">Guardrail verdicts</span> — how many actions were denied, escalated to a human, and allowed. The <span className="text-slate-200">Open guardrails</span> button takes you to the Guardrails page.</li>
          <li><span className="text-slate-200">Model fleet health</span> — each endpoint with its model, region, latency and health status.</li>
          <li><span className="text-slate-200">Live activity stream</span> — the latest SIEM events, newest first, with their type, message, severity and time.</li>
        </ul>
      </GuideSection>

      <GuideSection id="agents" title="4. Agents">
        <p>
          An agent in SentinAI is a registered autonomous system that acts on your behalf — for
          example a trading bot, a database helper or a support assistant. Registering an agent here
          is what brings it under guardrail control, SIEM logging and the audit trail.
        </p>
        <p>
          The Agents page lists every registered agent with its name, role, status, model, tools,
          daily spend limit, repository (when one is set) and who created it and when. Where a
          detail has not been set, the page shows <Mono>not set</Mono> rather than guessing a value.
        </p>
        <p>To create an agent, fill in the <span className="text-slate-200">Create agent</span> form:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">Name</span> — required. It must be unique; a name that already exists (in any capitalisation) is rejected with an error message.</li>
          <li><span className="text-slate-200">Purpose / role</span> — a short description of what the agent does.</li>
          <li><span className="text-slate-200">Model</span> — the model the agent uses, if known. Leave it blank and it stays <Mono>not set</Mono>.</li>
          <li><span className="text-slate-200">Tools (comma-separated)</span> — the tools the agent may use, separated by commas, for example <Mono>read-only, web search</Mono>. Leave it blank if none are set.</li>
          <li><span className="text-slate-200">Daily spend limit</span> — the most the agent may spend per day, if a limit applies. Leave it blank and it stays <Mono>not set</Mono>.</li>
          <li><span className="text-slate-200">Status</span> — <Mono>active</Mono> or <Mono>paused</Mono>. A new agent normally starts active.</li>
        </ul>
        <p>
          Click <span className="text-slate-200">Create agent</span>. If something is wrong, the
          error appears under the form. On success the form clears and the new agent appears in the
          list straight away. The agent is recorded as created by your signed-in GitHub login, and
          the creation is written to the audit log and the SIEM stream.
        </p>
        <p>
          Each agent has a <span className="text-slate-200">Pause agent</span> /{' '}
          <span className="text-slate-200">Resume agent</span> button. Pausing stops the agent being
          counted as active; resuming brings it back. Both actions are written to the audit log and
          the SIEM stream.
        </p>
        <p>
          <span className="text-slate-200">aetherbot</span> is the pre-loaded first agent: an
          autonomous crypto trading bot, linked to <Mono>github.com/k3lick/aetherbot</Mono>. Its
          model, tools and spend limit are not set. The only performance figure shown for it is
          labelled paper-test context: a fixture backtest of −8.25 USDT on 10,000 paper USDT.
          That is a paper test, not live trading results.
        </p>
      </GuideSection>

      <GuideSection id="registry" title="5. Model Registry">
        <p>
          The Model Registry is the list of model endpoints — the nodes your agents run on. Each
          node has a name, a model, a region and a health status.
        </p>
        <p>
          To add a node, type an <span className="text-slate-200">endpoint name</span> and a{' '}
          <span className="text-slate-200">model</span> (for example <Mono>llama3.1:8b</Mono>) and
          click <span className="text-slate-200">Register</span>. A new node starts as healthy, in
          the <Mono>edge</Mono> region, with no latency readings yet — it has not been probed.
        </p>
        <p>Health states:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">healthy</span> — the node is responding normally.</li>
          <li><span className="text-slate-200">degraded</span> — the node is slow: its p95 latency is above 1,500 ms.</li>
          <li><span className="text-slate-200">offline</span> — the node is not responding. A node keeps the status it was registered or last probed with; a node that has never been probed is not treated as offline.</li>
        </ul>
        <p>
          Click <span className="text-slate-200">Probe</span> next to a node to take a fresh latency
          reading. The reading shows two numbers: <span className="text-slate-200">p50</span>, the
          median response time, and <span className="text-slate-200">p95</span>, the response time
          that 95% of requests beat — in other words, how slow the slowest few requests are. Lower
          is better. After a probe the node is marked healthy or degraded depending on its p95, and
          the probe is written to the audit log. In this build the Probe button generates a local
          latency reading rather than measuring a live network round-trip.
        </p>
      </GuideSection>

      <GuideSection id="guardrails" title="6. Guardrails">
        <p>
          Guardrails are the policy rules that every agent action is checked against before it is
          allowed to run. The rules are enforced by the policy engine, and every verdict is saved —
          nothing is decided silently.
        </p>
        <p>The rules:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><Mono>DB-001</Mono> — Destructive statement blocked. <span className="text-slate-200">DROP</span>, <span className="text-slate-200">DELETE</span>, <span className="text-slate-200">TRUNCATE</span> and similar statements are denied.</li>
          <li><Mono>DB-020</Mono> — Bulk exfiltration risk. Large exports of customer or contact data go to a human for review.</li>
          <li><Mono>DB-030</Mono> — PII projection without an explicit limit. Reading personal data with no row limit goes to a human for review.</li>
          <li><Mono>DB-000</Mono> — Read-only query. Ordinary bounded reads are allowed.</li>
          <li><Mono>PR-001</Mono> — Prompt injection attempt blocked. Prompts that try to override instructions are denied.</li>
          <li><Mono>DB-900</Mono> — Unrecognised statement. Anything the engine cannot classify goes to a human rather than being silently allowed.</li>
        </ul>
        <p>
          To test a statement, go to the <span className="text-slate-200">Tool Call Simulator</span>,
          pick a tool (<span className="text-slate-200">Database query</span> or{' '}
          <span className="text-slate-200">CRM export</span>), type or paste a statement — or tap one
          of the example chips — and click <span className="text-slate-200">Evaluate against policy</span>.
          The <span className="text-slate-200">Policy Inspector</span> shows the verdict, the rule
          that matched, the tool and the severity.
        </p>
        <p>
          The <span className="text-slate-200">Prompt Testbed</span> does the same for a prompt:
          type a prompt and click <span className="text-slate-200">Test prompt</span> to check it for
          injection patterns.
        </p>
        <p>What the verdicts mean:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">ALLOWED</span> — the action passed the rules and may go ahead.</li>
          <li><span className="text-slate-200">DENIED</span> — the action broke a rule and is blocked. It does not run.</li>
          <li><span className="text-slate-200">ESCALATED / HUMAN APPROVAL</span> — the action is risky but not automatically blocked. It waits in Approvals until a human approves or rejects it.</li>
        </ul>
        <p>
          Every verdict goes to three places: a policy decision record (shown under{' '}
          <span className="text-slate-200">Recent Policy Decisions</span>), a SIEM event, and an
          entry in the audit log. Escalated verdicts also appear in Approvals &amp; SoD, covered
          in section 9.
        </p>
      </GuideSection>

      <GuideSection id="documents" title="7. Documents">
        <p>
          The Documents page scans files your agents handle for secrets and sensitive data, before
          that data can leak anywhere.
        </p>
        <p>
          To ingest a document, type a <span className="text-slate-200">document name</span>, paste
          the document content, and click <span className="text-slate-200">Scan &amp; ingest</span>.
          The content is checked for sensitive patterns — API keys, passwords, secrets, AWS
          credentials, private keys and social security numbers.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><span className="text-slate-200">CLEAN</span> — no sensitive pattern was found. The document is stored as clean.</li>
          <li><span className="text-slate-200">Findings</span> — each matched pattern is listed as a finding, marked critical or high.</li>
          <li><span className="text-slate-200">Quarantined</span> — if a critical pattern was found, the document is quarantined automatically, so it is held apart from clean documents.</li>
        </ul>
        <p>
          Re-ingesting the same file does not duplicate it: a document with the same name (in any
          capitalisation) or the same content is already in the library, and the page tells you so
          instead of adding a second copy.
        </p>
        <p>
          The <span className="text-slate-200">sample: leaked credentials</span> and{' '}
          <span className="text-slate-200">sample: clean doc</span> chips fill in example documents
          so you can try the scan without typing anything.
        </p>
      </GuideSection>

      <GuideSection id="incidents" title="8. Incidents">
        <p>
          An incident is a declared problem — a breach, an outage, a policy failure — that needs a
          tracked response. Declaring one makes it visible on the Overview dashboard and starts the
          response-time clock.
        </p>
        <p>
          To declare an incident, pick a severity (<Mono>SEV-1</Mono>, <Mono>SEV-2</Mono> or{' '}
          <Mono>SEV-3</Mono>), type an <span className="text-slate-200">incident title</span> and
          click <span className="text-slate-200">Declare</span>. The incident is recorded as open
          and written to the audit log.
        </p>
        <p>Severities and their response targets (SLA):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><Mono>SEV-1</Mono> — acknowledge within 15 minutes, resolve within 4 hours.</li>
          <li><Mono>SEV-2</Mono> — acknowledge within 1 hour, resolve within 24 hours.</li>
          <li><Mono>SEV-3</Mono> — acknowledge within 4 hours, resolve within 72 hours.</li>
        </ul>
        <p>
          Each incident in the list shows its severity and its acknowledge and resolve targets,
          taken from the shared SLA table — so an old incident always shows the current targets.
          When the work is done, click <span className="text-slate-200">Resolve</span> next to the
          incident. Resolved incidents stay in the list marked <Mono>RESOLVED</Mono> and no longer
          count as open.
        </p>
      </GuideSection>

      <GuideSection id="approvals" title="9. Approvals &amp; separation of duties">
        <p>
          When a guardrail verdict is escalated, the action does not run. It lands in{' '}
          <span className="text-slate-200">Approvals &amp; SoD</span> as a pending item, showing the
          statement, the tool, the rule that matched, the severity, who requested it and when.
        </p>
        <p>
          To decide it, click <span className="text-slate-200">Approve</span> or{' '}
          <span className="text-slate-200">Reject</span>. The decision is recorded with your
          signed-in GitHub login as the approver, and written to the audit log and the SIEM stream.
          Decided items move to the <span className="text-slate-200">Decided</span> list, showing
          whether each was approved or rejected and by whom.
        </p>
        <p>
          Separation of duties is enforced: the person who requested an action cannot approve their
          own request. If you try, the page shows an error —{' '}
          <span className="text-slate-200">Separation of duties: the requester cannot approve their
          own request.</span> Somebody else must decide it. This is also why the seeded history
          uses agent identities as requesters, never a signed-in user: those items can actually be
          approved.
        </p>
      </GuideSection>

      <GuideSection id="audit-log" title="10. Audit Log">
        <p>
          The Audit Log is the permanent record of everything SentinAI does: guardrail verdicts,
          approvals, agent creation and pause/resume, endpoint probes and registrations, document
          scans, incidents opened and resolved. Each entry shows its type, message, severity and time.
        </p>
        <p>
          The log is hash-chained and tamper-evident: every record contains a hash computed from
          the previous record&apos;s hash plus its own timestamp, type and message. If any record
          were changed or removed afterwards, the hashes after it would no longer line up.
        </p>
        <p>
          The badge at the top right shows the result of that check: <Mono>CHAIN VERIFIED</Mono>{' '}
          means every record lines up; <Mono>CHAIN BROKEN</Mono> means a record has been tampered
          with. The same check is shown in the sidebar as{' '}
          <span className="text-slate-200">audit chain verified</span> or{' '}
          <span className="text-slate-200">audit chain TAMPERED</span>. Each entry also shows the
          first characters of its hash (for example <Mono>#a1b2c3d4</Mono>) so a record can be
          identified precisely.
        </p>
      </GuideSection>

      <GuideSection id="siem" title="11. SIEM Streaming">
        <p>
          SIEM Streaming is the live event stream: every guardrail verdict, approval, agent change,
          endpoint probe, document scan and incident, as it happens, newest first. Each row shows
          the event type, a short message, the severity and the time.
        </p>
        <p>
          The filter buttons at the top narrow the stream: <Mono>all</Mono> shows everything, while{' '}
          <Mono>DENY</Mono>, <Mono>HUMAN</Mono> and <Mono>ALLOW</Mono> show only events whose type
          contains that word — so <Mono>DENY</Mono> shows both guardrail denials and policy denials.
          The page recognises 13 event types, including <Mono>GUARDRAIL_DENY</Mono>,{' '}
          <Mono>ENDPOINT_PROBED</Mono>, <Mono>DOC_QUARANTINED</Mono> and{' '}
          <Mono>INCIDENT_OPENED</Mono>.
        </p>
        <p>
          The <span className="text-slate-200">Export NDJSON</span> button downloads the events as
          a JSON file (<Mono>sentinai-siem-export.json</Mono>) so they can be kept or loaded into
          another tool.
        </p>
      </GuideSection>

      <GuideSection id="admin-pages" title="12. SLA &amp; Escalation, Governance, Compliance, Settings">
        <p>
          <span className="text-slate-200">Orchestration</span> shows how endpoints are routed:
          one route per endpoint, in the form tenant/region → endpoint name and model, with its
          latency readings, last probe time and health status.
        </p>
        <p>
          <span className="text-slate-200">SLA &amp; Escalation</span> lists the response targets
          from the shared SLA table — SEV-1 acknowledge 15 minutes / resolve 4 hours, SEV-2
          acknowledge 1 hour / resolve 24 hours, SEV-3 acknowledge 4 hours / resolve 72 hours —
          and the escalation ladder: on-call, then shift lead, then CISO. If a target is breached,
          the next rung of the ladder is paged. Open incidents are listed underneath with their
          SLA clocks.
        </p>
        <p>
          <span className="text-slate-200">Governance</span> states the tenant (<Mono>acme-core</Mono>),
          the retention period (400 days) and the policy owner{' '}
          (<Mono>platform-security@acme-core.example</Mono>), shows whether the audit chain is
          verified, and lists the active guardrail policies with their rule code, verdict and
          severity.
        </p>
        <p>
          <span className="text-slate-200">Compliance</span> shows evidence counts drawn from the
          live records, mapped to the frameworks they support: SOC 2 CC7.2 for guardrail decisions,
          ISO 27001 A.12.4 for the audit chain, GDPR Article 32 for quarantined documents holding
          personal data, EU AI Act Articles 9 and 14 for risk management and human oversight, and
          the NIST AI Risk Management Framework (Govern, Map, Measure, Manage).
        </p>
        <p>
          <span className="text-slate-200">Settings</span> describes the local setup: storage is
          localStorage (the code in <Mono>lib/db.js</Mono> can be swapped for a REST backend),
          sign-in is GitHub only via the device flow, no passwords are stored, and demo data can be
          reset by running <Mono>localStorage.clear()</Mono> and reloading — see section 13.
        </p>
      </GuideSection>

      <GuideSection id="data-privacy" title="13. Data &amp; privacy">
        <p>
          Everything SentinAI stores lives locally in your browser, in local storage under the key{' '}
          <Mono>sentinai.db.v1</Mono>. Your sign-in session is stored the same way, under{' '}
          <Mono>sentinai.session</Mono>. Nothing is sent to a server of SentinAI&apos;s own, and
          the only outside service involved is GitHub, for sign-in.
        </p>
        <p>
          The app starts with sample data so it can be explored straight away: two test endpoints
          (<Mono>test-node-a</Mono> and <Mono>test-node-b</Mono>), a short history of guardrail
          verdicts made by agent identities, and the aetherbot agent. Agents you create, documents
          you ingest, incidents you declare and verdicts you run are live records in the same store
          — the sample data and your own data sit side by side, so check the record before quoting
          a number.
        </p>
        <p>
          To reset the demo data, open your browser&apos;s developer console and run{' '}
          <Mono>localStorage.clear()</Mono>, then reload the page. That wipes the whole store —
          including your sign-in session, so you will need to sign in again — and the app seeds a
          fresh copy of the sample data on next load.
        </p>
      </GuideSection>

      <GuideSection id="troubleshooting" title="14. Troubleshooting">
        <p>
          <span className="text-slate-200">Sign-in code expired.</span> The GitHub code lasts about
          15 minutes. If it expires before you approve it, the sign-in screen says so — click{' '}
          <span className="text-slate-200">Start again</span> to get a fresh code and try again.
        </p>
        <p>
          <span className="text-slate-200">The Authorize button on GitHub is slow.</span> After
          you enter the code, GitHub&apos;s Authorize button can take around 20 seconds to respond.
          That delay is GitHub&apos;s, not SentinAI&apos;s — wait for it rather than clicking again
          or starting a new code.
        </p>
        <p>
          <span className="text-slate-200">Sign-in was denied or could not start.</span> If you
          declined the authorisation on GitHub, or the app could not reach GitHub, the sign-in
          screen explains what happened. Check your connection and click{' '}
          <span className="text-slate-200">Start again</span>.
        </p>
        <p>
          <span className="text-slate-200">A page shows an error card.</span> If a page fails to
          render, SentinAI shows a card saying <span className="text-slate-200">Something went wrong
          on this page</span> instead of a blank screen. The rest of the app is fine — the sidebar
          stays working. Click <span className="text-slate-200">Reload app</span> to reload, or{' '}
          <span className="text-slate-200">Back to Overview</span> to go back to the dashboard.
        </p>
        <p>
          <span className="text-slate-200">Where to report problems.</span> If something in
          SentinAI is broken or wrong, raise an issue on the project&apos;s GitHub repository at{' '}
          <Mono>github.com/k3lick/sentinai-guardian</Mono>, describing what you were doing, what you
          expected, and what happened instead — including the exact error message if one was shown.
        </p>
      </GuideSection>
    </div>
  );
}
