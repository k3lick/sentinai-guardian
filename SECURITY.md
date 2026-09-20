# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The SentinAI Guardian team takes security vulnerabilities seriously.

### Responsible Disclosure Guidelines
- **Do not open public GitHub issues** for security vulnerabilities.
- Send an advisory detailing the vulnerability, impact, reproduction steps, and potential mitigation to:
  - **Email**: security@sentinai.internal or through private GitHub Security Advisories.
- Include complete reproduction steps or proof-of-concept scripts.

### Response Timelines
- **Initial Acknowledgement**: Within 24 hours
- **Triage & Severity Assessment**: Within 72 hours
- **Remediation & Patch Release**: Within 14 business days for Critical/High severity issues

### Scope
- Model orchestration & credential proxying
- Tool execution sandboxing & MCP policy enforcement
- Document quarantine and forensic integrity checks
- Separation-of-duties and role-based access control (RBAC) gates
