# Changelog

## Unreleased

Changes being prepared for 1.1.0. The published package remains 1.0.3.

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
- Keep dependency PRs out of automatic stale closure and document weekly triage.
- Remove a redundant iframe load callback and comments that repeat the code.
  Public APIs and loading behavior are unchanged.

### Known development dependency issue

- tsup 8.5.1 requires esbuild `^0.27.0`, which remains affected by
  [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr).
  The low-severity advisory concerns the development server on Windows. This
  repository uses esbuild for package builds, not that server. No dependency
  override or audit suppression is applied.
