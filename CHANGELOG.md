# Changelog

## 1.1.1 - 2026-10-02

### Documentation and integration skill

- Clarify App Router scope, consumer compatibility versus contributor tooling,
  and the distinction between private Grafana URLs and public proxy root URLs.
- Correct embedding setup, custom proxy path guidance, and authenticated
  verification. Health checks and iframe load events do not prove identity,
  authorization, or panel rendering.
- Update the installable integration skill to preserve existing session systems,
  await route parameters, verify signed-out rejection, and sanitize diagnostics.
- Remove references to nonexistent generated docs and duplicated example version
  inventories. Document iframe, timeout, and Grafana Live WebSocket limitations.
- Warn before destructive demo volume resets and document the current PR,
  signed-tag, npm preflight, and release-recovery workflow.

### Release maintenance

- Refresh compatible dependency patches to clear high/critical audit blockers:
  Next.js 16.3.8 in all four maintained apps and the root tooling lockfile,
  brace-expansion 5.0.12, and undici 8.11.2 in root tooling.
- Keep runtime source, public exports, consumer peer ranges, and Grafana stack
  configuration unchanged. Consumer apps must patch their own dependencies.
- The previously documented low-severity esbuild development-server advisory
  remains an upstream tooling limitation. No override or audit suppression is used.

## 1.1.0 - 2026-09-20

Changes since the last npm release, 1.0.2. Version 1.0.3 was not published.

### Proxy and dashboard fixes

- Return upstream redirects to the browser rather than following them with trusted
  identity headers. Preserve the upstream `Location` header.
- Block hop-by-hop request headers, including headers named by `Connection`, even
  when explicitly included in the forwarding allowlist.
- Preserve multiple upstream cookies and handle bodyless responses correctly.
- Normalize trailing slashes in proxy and dashboard URLs.
- Allow `sandbox={null}` to omit the iframe sandbox attribute. The default remains
  `allow-scripts allow-same-origin allow-forms`.

### Compatibility

- Keep the existing package entry points and consumer peer dependency ranges.
  Node.js 18.18 or later is required. Repository development uses newer Node.js
  versions documented in CONTRIBUTING.md.
- Keep Grafana's public root URL aligned with the proxy path so browser redirects
  resolve correctly. Consumer applications must upgrade their own dependencies.

### Documentation

- Shorten the setup guide and integration skill while retaining authentication,
  proxy-path, and Grafana configuration requirements.
- Verify documentation links in pull-request CI.

### Maintenance

- Update example React dependencies to 19.3.0 and refresh compatible lint, test,
  and TypeScript declaration tooling. TypeScript stays on 5.9.3.

- Update the examples to Next.js 16.3.5 and refresh lockfiles to address Next.js,
  sharp, and Vitest advisories. Consumer peer dependency ranges are unchanged.
  Applications must update their own Next.js dependencies separately.
- Group routine example updates across directories and group security fixes
  separately. Keep major version updates out of routine groups.
- Keep dependency PRs out of automatic stale closure. Check routine updates monthly
  with one open version-update PR per entry, while keeping security updates enabled.
- Remove a redundant iframe load callback and comments that repeat the code.
  Public APIs and loading behavior are unchanged.

### Known development dependency issue

- tsup 8.5.1 requires esbuild `^0.27.0`, which remains affected by
  [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr).
  The low-severity advisory concerns the development server on Windows. This
  repository uses esbuild for package builds, not that server. No dependency
  override or audit suppression is applied.
