# Authoring Templates and 150-Line Guardrails

## Objective
- Standardize AI-facing docs while enforcing concise, retrieval-friendly size.

## Procedural Template
```md
# <Title>

## Objective
- <Outcome>

## Inputs
- <Required context/files>

## Steps
1. <Action>
2. <Action>

## Verification
- <Concrete checks>

## Next Route
- <Next file>
```

## Troubleshooting Card Template
```md
## <Symptom>
- Likely causes
- Checks
- Fixes
- Verify
- Escalate when
```

## Line Budgets
- Title + objective + metadata: <= 15 lines.
- Main procedure or playbook body: <= 110 lines.
- Verification and routing: <= 25 lines.

## Split Rules
- If a draft exceeds 150 lines, split by intent or failure class.
- Add cross-links between split files with explicit `Next Route`.

## Guardrail Check
- Run:
  - `wc -l docs/ai-setup/*.md`
- Fail when any file is greater than 150 lines.

## Next Route
- Primary: `docs/ai-setup/validation-harness.md`
- Blocked path: `docs/ai-setup/troubleshooting-playbooks.md`
