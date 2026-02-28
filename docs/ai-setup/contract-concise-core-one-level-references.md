# Contract B: Concise Core and One-Level References (DOC-022)

## Concise-Core Limits
- Primary docs should contain routing + constraints only.
- Detailed logic belongs in one referenced contract document.
- If a primary section needs sub-procedures, split into a dedicated file.

## One-Level Reference Policy
- Mandatory flows must not require chains deeper than one immediate reference.
- Allowed: `README` -> contract file.
- Not allowed: `README` -> guide -> sub-guide -> appendix for mandatory steps.

## Reference Organization
- Use stable kebab-case files under `docs/ai-setup/`.
- Each referenced file must expose an explicit `Next Route` with primary and blocked path.
- Long references include clear section headers and deterministic checklists.

## Fail Conditions
- Reference sprawl that duplicates the same decision logic in multiple files.
- Nested indirection where required action is delayed behind two or more hops.
