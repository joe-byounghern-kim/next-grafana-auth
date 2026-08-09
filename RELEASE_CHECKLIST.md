# Release Checklist

Use this checklist before cutting a release tag.

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
  tag_version="${GITHUB_REF_NAME#v}"
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
docker compose -f examples/docker-compose.yml down -v
npm run docs:check
npm audit --audit-level=high
npm pack --dry-run
```

## Publish the release

- [ ] Create the signed tag: `git tag -s vX.Y.Z -m "Release vX.Y.Z"`
- [ ] Push the signed tag: `git push origin vX.Y.Z`
- [ ] Confirm the `Release` workflow validates, publishes the package to npm, and creates the GitHub Release.
- [ ] Smoke-test the published package by installing it in a clean Next.js app and rendering a dashboard through the proxy.

## Monitor after release

- [ ] Verify the npm package page and published install.
- [ ] Monitor issues for regressions after the release.
