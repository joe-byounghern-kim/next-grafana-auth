# Security Policy

## Supported Versions

We currently provide security updates for the latest stable release line.

| Version | Supported |
|---------|-----------|
| 1.x.x   | Yes |
| < 1.0.0 | No |

## Reporting a Vulnerability

Please do not open public GitHub issues for suspected vulnerabilities.

- GitHub security advisory: use the repository "Report a vulnerability" flow
- If advisory flow is unavailable, open a private maintainer contact request via repository owners

When reporting, include:

- A clear description of the issue and impact
- Reproduction steps or proof-of-concept
- Affected versions and environment details
- Any suggested mitigation

## Response Targets

- Initial acknowledgement: within 72 hours
- Triage decision: within 7 days
- Fix plan or mitigation guidance: as soon as practical based on severity

## Disclosure Policy

- We follow coordinated disclosure.
- We will publish a fix and release notes once remediation is available.
- Credit will be given to reporters unless anonymity is requested.

## Security Baseline Expectations

For deployments using this package:

- Keep identity headers trusted only at your controlled proxy boundary.
- Use secure session cookie attributes (`HttpOnly`, `Secure`, explicit `SameSite`).
- Configure Grafana auth-proxy whitelist and HTTPS for production.
- Keep dependencies and Grafana runtime patched.
