# SKL-012 Installability Evidence

## Case 1: Positive `owner/repo`
- command: `npx --yes skills add joe-byounghern-kim/next-grafana-auth`
- exit_code: `1`
- expected_result: `pass`
- observed_tokens:
  - `Source: https://github.com/joe-byounghern-kim/next-grafana-auth.git`
  - `Repository cloned`
  - `No skills found`
  - `No valid skills found. Skills require a SKILL.md with name and description.`
- install_state: `absent`
- result: `fail`

## Case 2: Positive `owner/repo/path`
- command: `npx --yes skills add joe-byounghern-kim/next-grafana-auth/.agents/skills/next-grafana-auth`
- exit_code: `1`
- expected_result: `pass`
- observed_tokens:
  - `Source: https://github.com/joe-byounghern-kim/next-grafana-auth.git (.agents/skills/next-grafana-auth)`
  - `Repository cloned`
  - `No skills found`
  - `No valid skills found. Skills require a SKILL.md with name and description.`
- install_state: `absent`
- result: `fail`

## Case 3: Positive `owner/repo@skill-name`
- command: `npx --yes skills add joe-byounghern-kim/next-grafana-auth@next-grafana-auth`
- exit_code: `1`
- expected_result: `pass`
- observed_tokens:
  - `Source: https://github.com/joe-byounghern-kim/next-grafana-auth.git @next-grafana-auth`
  - `Repository cloned`
  - `No skills found`
  - `No valid skills found. Skills require a SKILL.md with name and description.`
- install_state: `absent`
- result: `fail`

## Case 4: Negative `missing source`
- command: `npx --yes skills add`
- exit_code: `1`
- expected_result: `fail`
- observed_tokens:
  - `ERROR  Missing required argument: source`
- install_state: `absent`
- result: `pass`

## Case 5: Negative `invalid repo subpath`
- command: `npx --yes skills add joe-byounghern-kim/next-grafana-auth/non-existent`
- exit_code: `1`
- expected_result: `fail`
- observed_tokens:
  - `Source: https://github.com/joe-byounghern-kim/next-grafana-auth.git (non-existent)`
  - `Repository cloned`
  - `No skills found`
  - `No valid skills found. Skills require a SKILL.md with name and description.`
- install_state: `absent`
- result: `pass`

## Case 6: Negative `nonexistent local path`
- command: `npx --yes skills add ./definitely-not-a-skill-path`
- exit_code: `1`
- expected_result: `fail`
- observed_tokens:
  - `Source: /Users/behoney/programming/nextjs-proxied-grafana-embedding/definitely-not-a-skill-path`
  - `Path not found`
  - `Local path does not exist`
- install_state: `absent`
- result: `pass`

## Summary
- Positive-path status: `fail` (0/3)
- Negative-path status: `pass` (3/3)
- Gate implication: `No-Go` until at least one mandatory positive-path case passes with exit code `0`.
