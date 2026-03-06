# API Reference

## Package Exports

- `next-grafana-auth`
  - `handleGrafanaProxy`
  - `extractGrafanaPath`
  - `isValidUrl`
  - `joinPaths`
  - `stripTrailingSlash`
  - shared types from `src/types.ts`
- `next-grafana-auth/component`
  - `GrafanaDashboard`

## `handleGrafanaProxy`

Server-side proxy helper that forwards requests to Grafana with trusted auth-proxy headers.

```ts
function handleGrafanaProxy(
  request: Request,
  config: GrafanaProxyConfig,
  pathParams?: string[]
): Promise<Response>
```

### `GrafanaProxyConfig`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `grafanaUrl` | `string` | Yes | - | Must be a valid `http` or `https` URL visible from the Next.js runtime |
| `userEmail` | `string` | Yes | - | Must be server-derived and free of whitespace/control characters |
| `userRole` | `'Admin' \| 'Editor' \| 'Viewer'` | Yes | - | Sent to Grafana as `X-WEBAUTH-ROLE` |
| `pathPrefix` | `string` | No | `'/api/grafana'` | Must stay aligned with route path and Grafana `root_url` |
| `requestTimeoutMs` | `number` | No | `10000` | Upstream timeout in milliseconds |
| `forwardRequestHeaders` | `string[]` | No | `[]` | Additional request headers to forward after safety filtering |

### Behavior Notes

- Replaces any inbound `X-WEBAUTH-*` headers with trusted server values.
- Never forwards inbound `Authorization` or `Cookie` headers to Grafana.
- Rejects invalid `userEmail`, invalid `userRole`, invalid `pathPrefix`, and invalid timeout values.
- Forwards safe response headers plus all upstream `Set-Cookie` values.
- Returns `504` when the upstream request times out.

## `GrafanaDashboard`

Client component for embedding a Grafana dashboard iframe behind the proxy route.

```tsx
<GrafanaDashboard baseUrl="/api/grafana" dashboardUid="your-dashboard-uid" />
```

### `GrafanaDashboardProps`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `baseUrl` | `string` | Yes | - | Proxy base URL, usually `/api/grafana` |
| `dashboardUid` | `string` | Yes | - | Grafana dashboard UID |
| `dashboardSlug` | `string` | No | `'dashboard'` | Optional slug for cleaner URLs |
| `params` | `GrafanaUrlParams` | No | `{}` | URL/query customization |
| `showLoading` | `boolean` | No | `true` | Shows overlay while the iframe loads |
| `minLoadingTime` | `number` | No | `1500` | Minimum spinner duration |
| `renderBuffer` | `number` | No | `500` | Extra time after iframe load before hiding overlay |
| `fallbackTimeoutMs` | `number` | No | `10000` | Timeout before the fallback state appears |
| `loadingMessage` | `string` | No | `'Loading dashboard...'` | Accessible loading text |
| `timeoutMessage` | `string` | No | `'Dashboard is taking longer than expected to load.'` | Timeout overlay text |
| `errorMessage` | `string` | No | `'Failed to load dashboard. Please try again.'` | Error overlay text |
| `title` | `string` | No | `'Grafana Dashboard'` | Accessible iframe title |
| `showRetryButton` | `boolean` | No | `true` | Shows retry CTA in timeout/error state |
| `retryButtonText` | `string` | No | `'Retry'` | Retry CTA label |
| `onRetry` | `(context: GrafanaRetryContext) => void` | No | - | Invoked when retry is triggered |
| `sandbox` | `string \| null` | No | `'allow-scripts allow-same-origin allow-forms'` | Use `null` to remove the attribute entirely |
| `className` | `string` | No | - | Container class name |
| `style` | `React.CSSProperties` | No | - | Container inline styles |

## `GrafanaUrlParams`

| Property | Type | Notes |
|---|---|---|
| `kiosk` | `boolean \| 'tv'` | Hides Grafana chrome |
| `theme` | `'light' \| 'dark'` | Dashboard theme |
| `refresh` | `string` | Auto-refresh interval such as `'5s'` or `'1m'` |
| `from` / `to` | `string` | Time-range bounds |
| `orgId` | `number` | Grafana organization id |
| `authToken` | `string` | Appended as `auth_token` query param; prefer session-cookie auth where possible |
| `variables` | `Record<string, string \| string[]>` | Serialized as `var-*` query params |

## Runtime Contract

- Recommended route: `app/api/grafana/[...path]/route.ts`
- Default proxy base path: `/api/grafana`
- Required environment variable: `GRAFANA_INTERNAL_URL`
- Topology defaults:
  - Host-run Next.js + Docker Grafana: `http://localhost:3001`
  - Next.js + Grafana on same Docker network: `http://grafana:3000`

## Security Reminders

- Derive `userEmail` and `userRole` from your server auth/session source only.
- Restrict role mapping to `Admin`, `Editor`, or `Viewer`.
- Keep route path, `pathPrefix`, iframe `baseUrl`, and Grafana `root_url` aligned.
- Prefer the default auth-proxy session-cookie flow over URL `authToken` usage.
