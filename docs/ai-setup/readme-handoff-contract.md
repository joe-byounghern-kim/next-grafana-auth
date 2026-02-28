# README Handoff Contract for LLM Reading Order

## Objective
- Define exact README routing behavior after initial read.

## Handoff Section Requirements
- Add a dedicated heading in `README.md`: `LLM Reading Order`.
- Include intent-based routes with explicit outcomes.
- Use stable relative links to `docs/ai-setup/*`.

## Intent Routes
- Quick evaluation -> `sandbox/README.md` then `docs/ai-setup/execution-protocol.md`.
- Full integration -> `docs/ai-setup/baseline-constraints.md` -> `repository-recognition.md` -> `setup-plan-generation.md`.
- Troubleshooting -> `docs/ai-setup/troubleshooting-playbooks.md`.
- Maintenance/authoring -> `docs/ai-setup/authoring-templates.md` and `validation-harness.md`.

## Wording Pattern
- Use short deterministic verbs: `Read`, `Run`, `Verify`, `Escalate`.
- Avoid open-ended language like `consider` or `maybe`.

## Validation
- Every linked document exists.
- Each linked document has a `Next Route` section.
- No README handoff link targets archived files.

## Next Route
- Primary: `docs/ai-setup/authoring-templates.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
