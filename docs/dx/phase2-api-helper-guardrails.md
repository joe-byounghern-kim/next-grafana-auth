# Phase 2 API Helper Guardrails (`createGrafanaProxyHandler`)

## Status

- **State:** Deferred
- **Task:** `DX-014`
- **Implementation gate:** No helper implementation may begin until the guardrails in this document are accepted in review.

## Goal

Define the narrowest safe contract for a future additive helper API that reduces repetitive
Next.js route boilerplate without changing the runtime or security behavior of
`handleGrafanaProxy`.

This document is intentionally stricter than a normal design note. If a future implementation
cannot satisfy these guardrails, the helper should not ship.

## Problem Statement

The current examples and sandbox all follow the same pattern:

1. Resolve auth/session state on the server.
2. Return an app-specific early `Response` for unauthorized or misconfigured requests.
3. Call `handleGrafanaProxy(request, config, (await params).path)`.
4. Re-export the same handler for `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`.

That repetition exists in:

- `examples/basic/app/api/grafana/[...path]/route.ts`
- `examples/custom-session/app/api/grafana/[...path]/route.ts`
- `examples/nextauth/app/api/grafana/[...path]/route.ts`
- `examples/prom-client/app/api/grafana/[...path]/route.ts`
- `sandbox/app/api/grafana/[...path]/route.ts`

The helper is only justified if it removes that duplication while preserving all existing proxy
invariants and keeping `handleGrafanaProxy` as the source of truth.

## Proposed Helper Contract

### Export Shape

Add exactly one new root export:

```ts
createGrafanaProxyHandler
```

Do not add a new package subpath export for this helper.

### Proposed Type Signature

```ts
import type { GrafanaProxyConfig } from 'next-grafana-auth'

type GrafanaProxyRouteContext = {
  params: Promise<{ path: string[] }>
}

type GrafanaProxyConfigResolver = (
  request: Request,
  context: GrafanaProxyRouteContext
) =>
  | Promise<GrafanaProxyConfig | Response>
  | GrafanaProxyConfig
  | Response

declare function createGrafanaProxyHandler(
  resolveConfig: GrafanaProxyConfigResolver
): {
  GET: (request: Request, context: GrafanaProxyRouteContext) => Promise<Response>
  POST: (request: Request, context: GrafanaProxyRouteContext) => Promise<Response>
  PUT: (request: Request, context: GrafanaProxyRouteContext) => Promise<Response>
  PATCH: (request: Request, context: GrafanaProxyRouteContext) => Promise<Response>
  DELETE: (request: Request, context: GrafanaProxyRouteContext) => Promise<Response>
}
```

### Why This Shape

- Keeps auth/session ownership with the integrating app.
- Preserves existing early-return patterns for `401` and missing-env `500` responses.
- Avoids inventing auth-specific abstractions.
- Keeps the helper as a thin wrapper over the existing proxy entry point.

### Behavioral Rules

1. `resolveConfig` may either:
   - return a valid `GrafanaProxyConfig`, or
   - return a `Response` to short-circuit proxy execution.
2. When `resolveConfig` returns a config object, the helper must:
   - await `context.params`,
   - read `.path`,
   - call `handleGrafanaProxy(request, config, path)`,
   - return that exact `Response`.
3. When `resolveConfig` returns a `Response`, the helper must return it unchanged.
4. The helper must not mutate the `request`, `context`, or resolved config before delegating,
   other than extracting `path`.
5. Thrown or rejected resolver failures are **not** silently swallowed. If a later implementation
   decides to translate them into a `500`, that response shape must be documented and tested.

## Explicit Non-Goals

The deferred helper must **not** do any of the following:

- Re-implement proxy, header, cookie, path, or timeout logic from `handleGrafanaProxy`
- Read `process.env.GRAFANA_INTERNAL_URL` automatically
- Integrate with NextAuth, Clerk, Better Auth, or any other auth provider directly
- Support Pages Router APIs, middleware, or Server Actions
- Add `HEAD` or `OPTIONS` handlers unless a separate requirement and test plan are approved
- Introduce response/header mutation hooks around the upstream Grafana response
- Add convenience APIs for `GrafanaDashboard` or dashboard URL generation
- Replace `handleGrafanaProxy` as the primary documented low-level API

## Compatibility Matrix

| Area | Baseline today | Required helper behavior |
| --- | --- | --- |
| Framework target | Next.js App Router route handlers using `params: Promise<{ path: string[] }>` | Match exactly; broader support is out of scope |
| Method support | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` in examples/sandbox | Return exactly those five handlers |
| Auth ownership | App resolves user/session before proxy call | Stay app-owned inside `resolveConfig` |
| Env ownership | App checks `GRAFANA_INTERNAL_URL` before proxy call | Stay app-owned inside `resolveConfig` |
| Proxy execution | `handleGrafanaProxy` is called directly | Helper must delegate to `handleGrafanaProxy` |
| Config surface | `GrafanaProxyConfig` fields only | No helper-only proxy behavior knobs |
| Backward compatibility | Existing exports and docs keep working | No breaking changes to current consumers |

## Backward-Compatibility Guarantees

Any implementation must preserve all of the following:

1. Existing `handleGrafanaProxy` imports, types, and behavior remain unchanged.
2. Existing `GrafanaDashboard` imports, types, and behavior remain unchanged.
3. Existing route examples remain valid even if they are not migrated to the helper.
4. Existing consumers are not required to adopt the helper to stay on the supported path.
5. The helper ships as an additive convenience API only.

## Security Invariants

The helper is acceptable only if it cannot weaken these existing invariants:

1. Inbound `X-WEBAUTH-*` headers from the client must still be ignored.
2. Inbound `Authorization` headers must never reach Grafana.
3. Inbound `Cookie` headers must never reach Grafana.
4. Unsafe `userEmail` values must still be rejected.
5. Invalid `userRole` values must still be rejected.
6. Path traversal segments must still be rejected.
7. Upstream `Set-Cookie` passthrough behavior must remain intact.
8. Timeout behavior must remain intact.

The helper must not expose any hook that allows callers to bypass these checks.

## Parity Test Matrix

If the helper is ever implemented, the following helper-specific tests are required in addition to
the current `handleGrafanaProxy` suite:

| Category | Scenario | Expected result |
| --- | --- | --- |
| Delegation | Resolver returns config | Helper calls `handleGrafanaProxy` with the same config and resolved `path` |
| Early return | Resolver returns `Response` | Helper returns that `Response` unchanged |
| Method parity | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | All exported handlers proxy identically to the baseline route pattern |
| Path handling | Empty path and populated path | Same target URL behavior as direct `handleGrafanaProxy` usage |
| Security parity | Spoofed inbound `X-WEBAUTH-*` | Still stripped by delegated proxy call |
| Security parity | Inbound `Authorization` / `Cookie` | Still blocked by delegated proxy call |
| Security parity | Unsafe `userEmail` | Same `400 Invalid user email` result |
| Security parity | Invalid `userRole` | Same `400 Invalid user role` result |
| Security parity | Path traversal params | Same `400 Invalid Grafana path` result |
| Header parity | `forwardRequestHeaders` with safe and forbidden values | Same allow/block outcomes as baseline |
| Response parity | Multiple `Set-Cookie` headers | Same passthrough behavior as baseline |
| Timeout parity | Upstream abort | Same `504 Grafana request timed out` result |
| Error parity | Resolver throw/reject | Documented behavior with explicit status/body assertion |

### Minimum Required Baseline Coverage

Before shipping the helper, the following existing test areas must still pass unchanged:

- invalid URL configuration
- invalid email / header-injection attempts
- invalid role
- GET proxying
- POST and DELETE request-body forwarding
- path traversal rejection
- safe request-header forwarding
- forbidden header blocking
- response metadata forwarding
- `Set-Cookie` passthrough
- timeout handling
- integration-level header and body passthrough

## Acceptance Gate for a Future Implementation PR

A future implementation PR is blocked unless it satisfies **all** of the following:

1. This document is present and reviewed.
2. The implementation adds only one new export: `createGrafanaProxyHandler`.
3. The implementation delegates to `handleGrafanaProxy` rather than duplicating its internals.
4. New tests cover every row in the parity matrix above.
5. The full existing verification suite still passes.
6. No docs are rewritten to imply the helper is mandatory.
7. Any unresolved behavior for thrown/rejected resolvers is settled in writing before code merges.

## Example of an Allowed Usage Pattern

```ts
import { createGrafanaProxyHandler } from 'next-grafana-auth'
import { cookies } from 'next/headers'

async function resolveConfig() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  const user = await getUserBySessionId(sessionId)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grafanaUrl = process.env.GRAFANA_INTERNAL_URL
  if (!grafanaUrl) {
    return Response.json({ error: 'Missing GRAFANA_INTERNAL_URL environment variable' }, { status: 500 })
  }

  return {
    grafanaUrl,
    userEmail: user.email,
    userRole: user.role,
  }
}

export const { GET, POST, PUT, PATCH, DELETE } = createGrafanaProxyHandler(resolveConfig)
```

## Example of a Disallowed Direction

The following changes would violate this guardrail document and require a separate design cycle:

- `createGrafanaProxyHandler({ authProvider: 'nextauth' })`
- `createGrafanaProxyHandler({ onProxyResponse(response) { ... } })`
- `createGrafanaProxyHandler({ allowForwardingAuthorization: true })`
- `createGrafanaProxyHandler()` that reads user identity directly from inbound headers
- automatic support for multiple route-context shapes without explicit compatibility guarantees

## Deferred-Until Checklist

The helper remains deferred until all items below are true:

- [ ] contract accepted
- [ ] non-goals accepted
- [ ] compatibility matrix accepted
- [ ] parity matrix accepted
- [ ] thrown/rejected resolver behavior accepted
- [ ] implementation PR scoped as additive-only

