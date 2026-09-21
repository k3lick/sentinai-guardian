# SentinAI — Compliance-First Agent Security Platform

Source code of the verified SentinAI app (the Base44 version, not the broken
Lovable prototype). React 18 + Vite + Tailwind, zero backend required —
persistence runs on a swappable storage adapter (localStorage by default).

## Quick start (VS Code / any editor)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
```

## Opening in Visual Studio Code

1. Install the VS Code extensions: ESLint, Tailwind CSS IntelliSense, Prettier.
2. Open the `sentinai/` folder in VS Code.
3. New terminal, then run the quick start commands above.

## Opening in Android Studio

The project includes a full Capacitor Android app (`android/` folder) that
wraps this web app as a native APK:

1. Open Android Studio, then open the `sentinai/android` folder.
2. Let Gradle sync finish (first time it downloads dependencies).
3. Press Run to install and launch on an emulator or USB-connected device.

To make code changes and refresh the Android app:

```bash
npm run build
npx cap sync android
```

Then re-run from Android Studio. Build a release APK with:
`Build > Generate Signed Bundle / APK` in Android Studio.

Requirements: Node 18+, Android Studio with SDK 34 and JDK 17.

First run: sign up with any email. The verification code is displayed in the
dev banner on the auth screen (`659314`). Log out and back in with the same
credentials afterwards.

## What works (verified against the live app)

1. **Real guardrail engine** (`src/lib/engine.js`) — content-based verdicts:
   - `DROP TABLE customers;` → **DENIED** (DB-001 · Destructive statement blocked, HIGH)
   - `DELETE FROM users;` → **DENIED** (DB-001, HIGH)
   - `SELECT * FROM orders WHERE ...;` → **ALLOWED** (DB-000 · Read-only query, LOW)
   - `SELECT * FROM crm.contacts LIMIT 50000` → **HUMAN APPROVAL** (DB-020 · Bulk exfiltration risk, MEDIUM)
   - PII projection without a limit → **HUMAN APPROVAL** (DB-030)
   - Prompt injection (`ignore previous instructions...`) → **DENIED** (PR-001)
   - Unrecognized statements are never silently allowed — they escalate (DB-900).
2. **Persistence** (`src/lib/db.js`) — every evaluation fans out to three
   collections: `PolicyDecision`, `SIEM event`, and `AuditLog`. Reload the app:
   everything is still there.
3. **Accurate metrics** — Overview numbers are computed from the records
   (fleet availability, quarantine volume, findings, incidents, verdict counts).
   Nothing is hardcoded.
4. **Tamper-evident audit chain** — each audit record hashes the previous
   record's hash. The sidebar shows live chain integrity; edit a record in
   localStorage and it flips to TAMPERED.
5. **Auth gate** — signup → email-code verification → session, mirroring the
   live app's flow.

## Layout

```
src/
  lib/engine.js      guardrail / policy engine (pure, unit-testable)
  lib/db.js          persistence, hash chain, metrics, seed data
  auth/AuthGate.jsx  signup / verification / login
  components/        Sidebar + shared UI primitives
  pages/             Overview, Guardrails, Documents, Incidents,
                     Model Registry, Audit Log, SIEM Streaming, + light sections
```

## Going to production

- Swap the storage adapter in `lib/db.js` (`setAdapter`) for a REST client;
  collections already mirror the entity shapes used by the Base44 app.
- Replace the simulated verification code with an email provider.
- Use SHA-256 (`crypto.subtle`) for the audit chain instead of FNV-1a.
- Add per-user record scoping (`createdBy`) enforcement on the server.

## Lovable prototype vs. this app

| Area | Lovable prototype | This app |
|---|---|---|
| `DROP TABLE` verdict | HUMAN APPROVAL (DB-014 PII review — wrong rule) | DENIED, DB-001, HIGH |
| Persistence | none (counters reset) | all verdicts/audits/SIEM stored |
| Metrics | hardcoded (96% availability with 0 healthy nodes) | computed from records |
| Auth | none | signup/verification/login |
