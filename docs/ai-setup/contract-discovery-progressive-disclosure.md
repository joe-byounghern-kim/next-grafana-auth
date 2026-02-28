# Contract A: Discovery Metadata and Progressive Disclosure (DOC-021)

## Required Discovery Metadata
- `name`: unique, concise route label.
- `description`: includes both intent and activation cue.
- `trigger-intent`: one-line phrase describing when this route should be selected.

## Progressive Disclosure Rules
- Top-level docs (`README.md`, `GETTING_STARTED.md`) provide only routing, constraints, and critical defaults.
- Detailed procedures, edge cases, and validation rules must live in one referenced contract file.
- If a section exceeds compact routing scope, link out instead of embedding implementation detail.

## Allowed and Forbidden Patterns
- Allowed: "Read X -> Run Y -> Verify Z".
- Forbidden: long explanatory paragraphs in top-level handoff sections.
- Forbidden: unresolved alternatives without deterministic tie-break criteria.

## Anti-Ambiguity Checks
- Every route includes a primary next route and a blocked path.
- No route requires reading more than one deep file before first actionable step.
- Route selection must be testable from metadata text alone.
