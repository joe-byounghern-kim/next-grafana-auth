# Package references

Use these repository documents for details not included in this skill:

Links to `main` describe the current repository. If behavior differs for an installed release, consult these files at its matching `vX.Y.Z` tag and the changelog.

Run `npm ls next-grafana-auth` first. For installed version X.Y.Z, replace `/blob/main/` with `/blob/vX.Y.Z/` (and `/tree/main/` with `/tree/vX.Y.Z/`) in the links below. For example, [1.1.1 API Reference](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/v1.1.1/docs/API_REFERENCE.md) describes that release rather than main. If a document does not exist at an older tag, use that tag's README and source. Check target-version docs separately when planning an upgrade.

- [README and security overview](https://github.com/joe-byounghern-kim/next-grafana-auth#readme)
- [Getting Started: route, topology, and Grafana configuration](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/GETTING_STARTED.md)
- [API Reference: exports, defaults, and proxy behavior](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/docs/API_REFERENCE.md)
- [Examples](https://github.com/joe-byounghern-kim/next-grafana-auth/tree/main/examples)
- [Sandbox](https://github.com/joe-byounghern-kim/next-grafana-auth/tree/main/sandbox)
- [Troubleshooting](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/TROUBLESHOOTING.md)
- [Changelog](https://github.com/joe-byounghern-kim/next-grafana-auth/blob/main/CHANGELOG.md)

The Basic and Sandbox routes use hardcoded demo identities. NextAuth and Custom Session examples include demo credentials. Reuse their integration structure, not their authentication storage or production policy.
