# API Reference

## Package Exports

- `next-grafana-auth`
  - `handleGrafanaProxy`
  - utility re-exports from `src/utils.ts`
  - shared types from `src/types.ts`
- `next-grafana-auth/component`
  - `GrafanaDashboard`

## handleGrafanaProxy

Core proxy handler that forwards requests to Grafana with trusted auth-proxy headers.

```ts
function handleGrafanaProxy(
  request: Request,
  config: GrafanaProxyConfig,
  pathParams?: string[]
): Promise<Response>
```

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `request` | `Request` | Yes | Web request object (NextRequest-compatible) |
| `config` | `GrafanaProxyConfig` | Yes | Proxy configuration |
| `pathParams` | `string[]` | No | Catch-all path array from `[...path]` route |

### GrafanaProxyConfig

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `grafanaUrl` | `string` | Yes | - | Internal Grafana URL (`http://localhost:3001` or `http://grafana:3000`) |
| `userEmail` | `string` | Yes | - | Authenticated user email sent as `X-WEBAUTH-USER` |
| `userRole` | `'Admin' \| 'Editor' \| 'Viewer'` | Yes | - | Grafana role sent as `X-WEBAUTH-ROLE` |
| `pathPrefix` | `string` | No | `'/api/grafana'` | Proxy route prefix used in upstream URL construction |
| `requestTimeoutMs` | `number` | No | `10000` | Upstream timeout in milliseconds |
| `forwardRequestHeaders` | `string[]` | No | `[]` | Extra request headers to forward (after safety filtering) |

### Behavior Notes

- Inbound `X-WEBAUTH-*` headers are ignored and replaced with trusted server values.
- Inbound `Authorization` and `Cookie` headers are never forwarded to Grafana.
- `userEmail` is validated against header-injection characters.
- `Set-Cookie` headers from Grafana are forwarded to client responses.

## GrafanaDashboard

React client component that renders a Grafana dashboard iframe.

```tsx
<GrafanaDashboard baseUrl="/api/grafana" dashboardUid="your-uid" />
```

### Props

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `baseUrl` | `string` | Yes | - | Proxy base URL (usually `/api/grafana`) |
| `dashboardUid` | `string` | Yes | - | Grafana dashboard UID |
| `dashboardSlug` | `string` | No | `'dashboard'` | Dashboard slug |
| `params` | `GrafanaUrlParams` | No | `{}` | Dashboard URL params |
| `showLoading` | `boolean` | No | `true` | Show loading overlay |
| `minLoadingTime` | `number` | No | `1500` | Minimum spinner time |
| `renderBuffer` | `number` | No | `500` | Buffer after iframe load |
| `fallbackTimeoutMs` | `number` | No | `10000` | Timeout before fallback state |
| `loadingMessage` | `string` | No | `'Loading dashboard...'` | Accessible loading text |
| `timeoutMessage` | `string` | No | `'Dashboard is taking longer than expected to load.'` | Timeout state text |
| `errorMessage` | `string` | No | `'Failed to load dashboard. Please try again.'` | Error state text |
| `title` | `string` | No | `'Grafana Dashboard'` | Iframe title |
| `showRetryButton` | `boolean` | No | `true` | Show retry action in timeout/error state |
| `retryButtonText` | `string` | No | `'Retry'` | Retry button label |
| `onRetry` | `(context: { attempt: number; reason: 'timeout' \| 'error' }) => void` | No | - | Retry callback |
| `sandbox` | `string` | No | `'allow-scripts allow-same-origin allow-forms'` | Iframe `sandbox` attribute value |
| `className` | `string` | No | - | CSS class name |
| `style` | `React.CSSProperties` | No | - | Inline style |

## GrafanaUrlParams

| Property | Type | Description |
|---|---|---|
| `kiosk` | `boolean \| 'tv'` | Kiosk mode |
| `theme` | `'light' \| 'dark'` | Dashboard theme |
| `refresh` | `string` | Auto-refresh interval (`'5s'`, `'1m'`, etc.) |
| `from` | `string` | Time range start |
| `to` | `string` | Time range end |
| `orgId` | `number` | Grafana organization id |
| `authToken` | `string` | Adds `auth_token` query param |
| `variables` | `Record<string, string \| string[]>` | Template variables |

Security warning: `authToken` is appended as a URL query param (`auth_token`), so it can appear in browser history, server logs, and referrer headers. Prefer session-cookie auth-proxy flow where possible.

## Configuration Reference

### Environment Variable

| Variable | Required | Example | Description |
|---|---|---|---|
| `GRAFANA_INTERNAL_URL` | Yes | `http://localhost:3001` | Internal URL used by server-to-server proxy calls |

### Default Route Contract

- Recommended route: `/api/grafana/[...path]/route.ts`
- Keep `pathPrefix` aligned with Grafana `root_url` and `serve_from_sub_path` settings.

### Topology Defaults

- Host-run Next.js + Docker Grafana: `GRAFANA_INTERNAL_URL=http://localhost:3001`
- Next.js and Grafana on same Docker network: `GRAFANA_INTERNAL_URL=http://grafana:3000`
