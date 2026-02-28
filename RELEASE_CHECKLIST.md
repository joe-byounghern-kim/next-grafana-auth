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
- [ ] Canonical docs URL is reachable: `https://joe-byounghern-kim.github.io/next-grafana-auth/`
- [ ] Docs acceptance gates pass (`Pages URL live`, `API docs navigable`, `key landing journeys reachable`)
- [ ] GitHub Release notes drafted for the version
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

---

## Release guide

1. Create the Signed Tag
Use the -s flag (short for --sign) to create a cryptographically signed tag.

Bash
```
git tag -s vX.Y.Z -m "Release version X.Y.Z"
```
-s: Tells Git to sign the tag using your default GPG key.

-m: Adds a message. Signed tags are "annotated" tags by default, so they require a message.

Note: Git might prompt you for your GPG passphrase in a popup or in the terminal depending on your configuration.

2. Verify the Tag (Optional but Recommended)
Before pushing, it’s good practice to ensure the signature is valid.

```
git tag -v vX.Y.Z
```

If successful, you’ll see a confirmation message like gpg: Good signature from... followed by your key details.

3. Push the Tag to the Remote
By default, a standard git push does not transfer tags to remote servers. You have to be explicit.

To push a specific tag:

```
git push origin vX.Y.Z
```

To push all your local tags at once:

```
git push origin --tags
```
