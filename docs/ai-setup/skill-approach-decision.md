# SKL-002 Approach Decision

## Decision
- Selected: Option B (contract-first skill finalization)

## Option Comparison
- Option A: in-place optimization of one large `SKILL.md`
  - Pros: fewer edits
  - Cons: drift risk, weak progressive disclosure, weak installability QA
- Option B: define contracts first, then rewrite concise-core skill + validation
  - Pros: deterministic behavior, explicit gates, easier review
  - Cons: more artifacts and sequencing

## Acceptance Criteria Impact
- Requires concrete contract artifacts before rewrite.
- Requires executable installability evidence before Go.

## Risks and Mitigations
- Risk: over-compression drops security invariants -> mitigation: invariant checklist in SKL-009.
- Risk: branch ambiguity for random projects -> mitigation: deterministic matrix in SKL-005.
