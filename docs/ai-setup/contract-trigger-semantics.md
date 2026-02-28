# Trigger and Anti-Trigger Semantics Contract (DOC-023)

## Route Triggers
- Quick evaluation: user intent contains fast validation/sandbox setup.
- Full integration: user intent contains implementation/integration in existing app.
- Troubleshooting: user reports failure symptoms, errors, or blocked verification.
- Authoring/validation: user modifies docs/contracts and needs conformance checks.

## Anti-Triggers
- Do not route to troubleshooting when no failure evidence exists.
- Do not route to full integration for docs-only contract edits.
- Do not route to quick evaluation when production auth/session behavior is requested.

## Tie-Break Precedence
1. Blocking failure symptoms -> troubleshooting.
2. Explicit implementation intent -> full integration.
3. Explicit evaluation intent -> quick evaluation.
4. Contract maintenance intent -> authoring/validation.

## Verification Checks
- Every route has at least one trigger and one anti-trigger.
- Overlapping intents are resolved by precedence without ambiguity.
