# SentinAI Guardian

[![Live Demo](https://img.shields.io/badge/Live_Demo-Lovable_Production-emerald.svg)](https://secure-sentinel-agent.lovable.app)
[![Architecture](https://img.shields.io/badge/Zero--Trust-Autonomous_AI_Agents-blue.svg)](#architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SentinAI Guardian** is an enterprise-grade zero-trust governance and defense console for autonomous AI agents. It protects corporate environments from prompt injection, credential exfiltration, and rogue tool calls through real-time payload inspection, automated document quarantine, separation-of-duties workflows, and tamper-evident compliance verification.

Live deployment: **[https://secure-sentinel-agent.lovable.app](https://secure-sentinel-agent.lovable.app)**

---

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [Architecture & Routing](#architecture--routing)
- [Application Views](#application-views)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Security & Compliance Posture](#security--compliance-posture)
- [License](#license)

---

## Core Capabilities

1. **Private Model Endpoint Orchestration (`/models`)**
   - Direct integration with local inference backends (Ollama, LM Studio, vLLM).
   - Real-time latency tracking (p50/p95), token velocity, consecutive failure counters, and automatic fallback switching.

2. **Automated Document Quarantine (`/documents`)**
   - Pre-execution scanning pipeline inspecting payloads for prompt injections, hardcoded API secrets, and sensitive PII.
   - Immediate sandbox quarantine isolating untrusted artifacts prior to agent ingestion.

3. **Enterprise Separation of Duties (`/approvals`)**
   - Four-eyes approval workflows requiring secondary sign-off for quarantine releases, model rollbacks, and retention policy alterations.
   - Immutable audit logging with reviewer notes and role badges.

4. **Cryptographic Compliance Verification (`/compliance`)**
   - Exportable compliance bundles with SHA-256 integrity checksums.
   - Built-in verification engine validating that exported audit bundles have not been altered.

5. **Normalized SIEM Streaming (`/siem`) & SLA Tracking (`/sla`)**
   - Event normalization into CEF, ECS, and JSON formats for streaming to Splunk, Datadog, or Elastic.
   - Tiered SLA countdown timers and escalation workflows for high-severity security incidents.

---

## Architecture & Routing

SentinAI Guardian is built with **TanStack Router**, **React 18**, **TypeScript**, and **Tailwind CSS**. All production routes are pre-rendered and verified:

| Route | View Name | Description |
|---|---|---|
| `/` | Overview Dashboard | Fleet health, active alerts, quarantine count, and recent events. |
| `/models` | Model Orchestration | Local LLM endpoints, latency p50/p95 telemetry, and fallbacks. |
| `/documents` | Quarantine & Scanning | File upload scanner, quarantine isolation, and finding breakdown. |
| `/guardrails` | Policy Simulator | Tool-call simulation, prompt injection rules, and denial testing. |
| `/incidents` | Incident Management | High-severity incident triage, root cause analysis, and assignment. |
| `/approvals` | 4-Eyes Governance | Dual-sign-off queue for releases, policy changes, and rollbacks. |
| `/sla` | SLA & Escalations | Countdown timers, response deadlines, and incident escalation stages. |
| `/siem` | SIEM Streaming | Outbound event streaming in CEF, ECS, and JSON formats. |
| `/compliance` | Compliance Verifier | SHA-256 package verification and audit evidence export. |
| `/audit` | Audit Log Explorer | Searchable, filterable event history with role and timestamp filters. |
| `/registry` | Model Version Registry | Compatibility matrices, deployment histories, and rollback triggers. |
| `/governance` | Retention Policies | Data retention rules, dry-run simulation, and admin purge approvals. |

---

## Local Development Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**, **pnpm**, or **bun**

### Installation

```bash
# 1. Clone repository
git clone https://github.com/malwar77/sentinai-guardian.git
cd sentinai-guardian

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will launch at `http://localhost:5173`.

### Connecting Local Inference Endpoints

Under **Model Orchestration (`/models`)**, configure your local runtime:
- **Ollama**: `http://localhost:11434`
- **LM Studio**: `http://localhost:1234/v1`
- **vLLM**: `http://localhost:8000/v1`

---

## Deployment

### Deploy to Lovable
Changes pushed to the default branch automatically sync and rebuild through Lovable's managed CI/CD pipeline.

### Self-Hosting (Vercel / Netlify / Cloudflare Pages)
Run the production build:
```bash
npm run build
```
Deploy the generated `dist/` directory to any static hosting provider. Configure SPA rewrite rules to redirect all incoming traffic to `index.html`.

---

## Security & Compliance Posture

- **Zero Untrusted Tool Execution**: Intercepts MCP and tool-calling interfaces prior to model execution.
- **Tamper-Evident Logs**: Event manifests are signed with cryptographic SHA-256 checksums.
- **Four-Eyes Gating**: Gated permissions ensure no single administrator can unquarantine infected data or bypass guardrails without independent review.

---

## License

MIT License. Designed and engineered for the AI systems and cybersecurity community.
