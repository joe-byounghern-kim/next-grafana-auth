# Release Checklist

Use this checklist before cutting a release tag.

## Pre-release Validation

- [ ] `npm ci` completes cleanly
- [ ] `npm run typecheck` passes
- [ ] `npm run test:run` passes
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `Examples and Sandbox Smoke Build` job passes in CI
- [ ] Bundle size is within CI limits (`dist/index.mjs` gzip <= 15KB)

## Documentation and Metadata

- [ ] `README.md` reflects current API behavior
- [ ] `CHANGELOG.md` contains release notes for the version
- [ ] `SECURITY.md`, `SUPPORT.md`, and `CONTRIBUTING.md` are up to date
- [ ] `package.json` version matches intended release tag (`vX.Y.Z`)

## Security and Governance

- [ ] No unresolved critical/high vulnerabilities (`npm audit --audit-level=high`)
- [ ] Security workflow is green in GitHub Actions
- [ ] Issue and PR templates remain aligned with maintainership policy

## Release Execution

- [ ] Create and push signed tag: `vX.Y.Z`
- [ ] Confirm `Release` workflow runs and publishes successfully
- [ ] Confirm GitHub Release notes are generated and accurate

## Post-release

- [ ] Verify package page on npm
- [ ] Smoke-test install in a clean Next.js app
- [ ] Announce release and monitor issues for regressions
