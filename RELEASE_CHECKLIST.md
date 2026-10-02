# Release Checklist

Use this checklist before cutting a release tag.

This repository releases an npm library and a GitHub Release. There is no production application deployment in this workflow. Use the contributor toolchain in [CONTRIBUTING.md](./CONTRIBUTING.md).

## Validate the release

- [ ] Clean install completes: `npm ci`
- [ ] Root suite passes: `npm run typecheck`, `npm run lint`, `npm run test:run`, and `npm run build`
- [ ] Package smoke checks pass: `npm run smoke:dist` and `npm run smoke:component`
- [ ] Documentation and link check passes: `npm run docs:check`
- [ ] Examples and sandbox smoke builds pass after the root build.
- [ ] Grafana smoke passes with the canonical Compose stack and verifier.
- [ ] High-severity dependency audit passes: `npm audit --audit-level=high`
- [ ] Package contents pass the dry run: `npm pack --dry-run`
- [ ] Version/tag equality passes:

  ```bash
  set -euo pipefail
  release_tag=vX.Y.Z # Replace with the intended local release tag.
  # In GitHub Actions, use release_tag="$GITHUB_REF_NAME" instead.
  tag_version="${release_tag#v}"
  package_version="$(node -p "require('./package.json').version")"
  test "$tag_version" = "$package_version"
  ```

For the runtime checks, run one block from the repository root:

```bash
set -euo pipefail
npm ci
npm run build
npm ci --prefix examples/basic
npm ci --prefix examples/custom-session
npm ci --prefix examples/nextauth
npm ci --prefix sandbox
npm run build --prefix examples/basic
npm run build --prefix examples/custom-session
npm run build --prefix examples/nextauth
npm run build --prefix sandbox
docker compose -f examples/docker-compose.yml config --quiet
docker compose -f examples/docker-compose.yml up -d
GRAFANA_BASE_URL=http://localhost:3001/api/grafana scripts/verify-grafana.sh
docker compose -f examples/docker-compose.yml down
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
```

## Publish the release

- [ ] Add a dated version entry to [CHANGELOG.md](./CHANGELOG.md), preserving historical entries.
- [ ] Update `package.json` and root lockfile version metadata. Refresh the local `next-grafana-auth` package metadata in all four app lockfiles after building the root package. Example app versions are independent and must not be bumped to the library version.
- [ ] Create a focused pull request with validation evidence and merge it only after CI and Security pass. Rerun validation after any fixes.
- [ ] Confirm the release commit is on `main` and its required CI checks pass.
- [ ] Run `gh workflow run release.yml --ref main` and confirm the manual preflight
  passes. This validates the package and checks the npm token's identity and package
  access without publishing or creating a GitHub Release. Token-specific publish
  restrictions and npm 2FA policy still apply to the actual publish operation.
- [ ] Create the signed tag: `git tag -s vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push the signed tag: `git push origin vX.Y.Z`
- [ ] Confirm the `Release` workflow validates, publishes the package to npm, and creates the GitHub Release.
- [ ] Smoke-test the published package by installing it in a clean Next.js app and rendering a dashboard through the proxy.

If publication fails, inspect the workflow before retrying. Confirm whether that exact version already exists on npm. Never move a published tag or reuse a published npm version. Do not disable audits or remove users' Grafana volumes to unblock a release. Consumers can temporarily pin the previous stable package version while a follow-up patch is prepared.

## Monitor after release

- [ ] Verify the npm package page and published install.
- [ ] Monitor issues for regressions after the release.
