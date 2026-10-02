# Support

## Where to Get Help

- Usage questions: open a GitHub Discussion (if enabled) or GitHub Issue
- Bug reports: use the Bug Report issue template
- Feature requests: use the Feature Request issue template
- Security concerns: follow `SECURITY.md` and do not disclose publicly

## Documentation Source of Truth

- Start with the [README](./README.md), [Getting Started](./GETTING_STARTED.md), and maintained [API Reference](./docs/API_REFERENCE.md).
- Exported TypeScript declarations and implementation in `src/` define the public API. There is no separate generated documentation site.
- Repository docs on `main` may describe unreleased changes. For a released package, consult the matching Git tag and [Changelog](./CHANGELOG.md).

## What to Include

When asking for help, include:

- `next-grafana-auth` version
- Node.js, Next.js, and Grafana versions
- Minimal reproduction steps
- Sanitized logs/error messages without session cookies, tokens, passwords, or private infrastructure details

## Response Expectations

- Best-effort community support by maintainers
- Triage for new issues typically within a few business days
- Security reports follow `SECURITY.md` timelines

## Scope of Support

Supported:

- Library behavior in this repository
- Documented integration paths and examples

Out of scope:

- Custom app/business logic outside this library
- Managed service SLAs or guaranteed turnaround
