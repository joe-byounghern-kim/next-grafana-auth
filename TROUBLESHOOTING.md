# Troubleshooting Guide

Common issues and solutions when using `next-grafana-auth`.

## Table of Contents

- [Quick Debugging Checklist](#quick-debugging-checklist)
- [Common Issues](#common-issues)
  - [401 Unauthorized](#401-unauthorized)
  - [404 Not Found](#404-not-found)
  - [Empty iframe / blank dashboard](#empty-iframe--blank-dashboard)
  - [CORS errors](#cors-errors)
  - [Mixed content warnings](#mixed-content-warnings)
  - [Session not persisting](#session-not-persisting)
  - [Dashboard loading spinner never disappears](#dashboard-loading-spinner-never-disappears)
  - [Route path errors](#route-path-errors)
  - [Docker networking issues](#docker-networking-issues)
  - [Grafana configuration errors](#grafana-configuration-errors)

---

## Quick Debugging Checklist

Before diving into specific issues, run through this checklist:

1. ✅ **Check Next.js version** - Must be 15.0.0 or higher
2. ✅ **Check route path alignment** - Default is `/api/grafana/[...path]/route.ts`; if customized, ensure `pathPrefix` and Grafana `root_url` match
3. ✅ **Check Grafana URL** - Docker: use `http://grafana:3000`, Local: use `http://localhost:3001`
4. ✅ **Check Grafana config** - Use `enable_login_token=true` when you rely on Grafana login token/cookie behavior
5. ✅ **Check environment variable** - `GRAFANA_INTERNAL_URL` must be set
6. ✅ **Check user session** - Verify your auth logic returns `{ email, role }`
7. ✅ **Check browser console** - Look for errors in DevTools
8. ✅ **Check server logs** - Look for errors in Next.js terminal output

---

## Common Issues

### 401 Unauthorized

**Symptoms:**
- Dashboard shows "Unauthorized" error
- iframe displays "Access denied" message

**Possible Causes:**
1. User not authenticated in your app
2. Session cookie missing or invalid
3. `getUserFromSession()` returns `null` or wrong format

**Solutions:**

1. **Check your auth logic:**
```typescript
// app/api/grafana/[...path]/route.ts
const cookieStore = await cookies()
const sessionId = cookieStore.get('session')?.value

console.log('Session ID:', sessionId) // Debug: Check if sessionId exists

const user = await getUserFromSession(sessionId)

console.log('User:', user) // Debug: Check if user is returned

if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

2. **Verify user object structure:**
```typescript
// Must return this structure:
{
  email: string,    // Required: user's email
  role: 'Admin' | 'Editor' | 'Viewer'  // Required: Grafana role
}
```

3. **Test with hardcoded user (temporary):**
```typescript
const user = { email: 'test@example.com', role: 'Viewer' }
// If this works, your auth logic is the problem
```

---

### 404 Not Found

**Symptoms:**
- Browser shows 404 error for `/api/grafana/...`
- Proxy handler not found

**Possible Causes:**
1. Route path is incorrect
2. Route file not created in the right location
3. Grafana path doesn't exist

**Solutions:**

1. **Verify route path and prefix alignment:**
```
Default:  app/api/grafana/[...path]/route.ts
NOT:      app/api/dashboard/[...path]/route.ts
NOT:      app/grafana/[...path]/route.ts
```

2. **Check file location:**
```bash
# Run from project root
ls -la "app/api/grafana/[...path]/route.ts"
```

3. **Test Grafana directly:**
```bash
# From your Next.js server
curl http://grafana:3000/api/grafana/d/your-dashboard

# Should return HTML or JSON, not 404
```

---

### Empty iframe / blank dashboard

**Symptoms:**
- iframe loads but shows blank/white screen
- Dashboard loads in new tab but not in iframe
- Grafana login page appears in iframe

**Possible Causes:**
1. Grafana `allow_embedding` not enabled
2. Grafana `root_url` misconfigured
3. X-Frame-Options blocking iframe
4. CORS issues

**Solutions:**

1. **Check Grafana config:**
```ini
[server]
allow_embedding = true

[security]
allow_embedding = true
```

2. **Verify root_url:**
```ini
[server]
# Keep this aligned with your proxy sub-path
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true  # Use true when serving from sub-path
```

3. **Check browser console for CORS:**
```
Look for: Access-Control-Allow-Origin errors
```

4. **Test iframe directly:**
```html
<iframe src="http://your-domain.com/api/grafana/d/your-dashboard"></iframe>
```

---

### CORS errors

**Symptoms:**
- Browser console shows CORS errors
- Requests blocked by CORS policy
- Dashboard doesn't load

**Possible Causes:**
1. Grafana CORS not configured
2. Mixed content (HTTP vs HTTPS)
3. Origin not allowed

**Solutions:**

1. **Add CORS headers to Grafana (if needed):**
```ini
[server]
# Add your domain to allowed origins
# Note: Grafana usually handles this automatically with auth-proxy
```

2. **Check for mixed content:**
```
If your app is HTTPS, Grafana must also be HTTPS
If your app is HTTP, Grafana must also be HTTP
```

3. **Verify proxy headers are being set:**
```typescript
// Check in browser DevTools > Network
// Look for X-WEBAUTH-USER and X-WEBAUTH-ROLE headers
```

---

### Mixed content warnings

**Symptoms:**
- Browser blocks insecure content
- Dashboard doesn't load
- Console shows "Mixed Content" errors

**Possible Causes:**
1. App served over HTTPS, Grafana over HTTP
2. App served over HTTP, Grafana over HTTPS

**Solutions:**

1. **Match protocols:**
```bash
# If app is HTTPS:
GRAFANA_INTERNAL_URL=https://grafana:3000

# If app is HTTP:
GRAFANA_INTERNAL_URL=http://grafana:3000
```

2. **Use relative URLs (for internal proxying):**
```typescript
// The proxy uses GRAFANA_INTERNAL_URL, so this shouldn't happen
// unless you're accessing Grafana directly from the browser
```

---

### Session not persisting

**Symptoms:**
- User gets logged out when navigating
- Dashboard shows "Unauthorized" after page refresh
- Session cookies not being set

**Possible Causes:**
1. Set-Cookie headers not forwarded
2. Grafana cookies not being set
3. Session cookie domain/path mismatch
4. Cookie security settings

**Solutions:**

1. **Check Set-Cookie forwarding:**
```typescript
// In your proxy handler, ensure this is present:
const setCookieHeaders = response.headers.getSetCookie()
for (const cookie of setCookieHeaders) {
  nextResponse.headers.append('Set-Cookie', cookie)
}
```

2. **Check Grafana cookie settings:**
```ini
[security]
cookie_samesite = none  # For cross-origin
cookie_secure = true    # For HTTPS
```

3. **Verify session cookie:**
```bash
# In browser DevTools > Application > Cookies
# Check that your session cookie exists and is sent with requests
```

4. **Test with devtools:**
```javascript
// In browser console:
document.cookie
// Should show your session cookie
```

---

### Dashboard loading spinner never disappears

**Symptoms:**
- Loading spinner shows indefinitely
- Dashboard never appears
- No errors in console

**Possible Causes:**
1. Grafana server unreachable
2. Network issues
3. iframe load event never fires
4. Auth failure (silent)

**Solutions:**

1. **Check if iframe loads:**
```html
<!-- Add this temporarily to debug -->
<iframe
  src="/api/grafana/d/your-dashboard"
  onLoad={() => console.log('iframe loaded')}
  onError={() => console.log('iframe error')}
></iframe>
```

2. **Test Grafana directly:**
```bash
curl http://grafana:3000/api/grafana/d/your-dashboard
```

3. **Check network tab in DevTools:**
- Look for failed requests
- Check response status codes
- Check response sizes

4. **Check fallback timeout:**
```tsx
// Default is 10 seconds
// If it takes longer, there's a network or auth issue
```

5. **Reduce timeout for debugging:**
```tsx
<GrafanaDashboard
  ...
  minLoadingTime={100}
  renderBuffer={50}
/>
```

---

### Route path errors

**Symptoms:**
- Next.js complains about route path
- Dynamic route not working
- Path params undefined

**Possible Causes:**
1. Route path not matching expected format
2. Path params not properly awaited (Next.js 15+)

**Solutions:**

1. **Verify route path:**
```
✅ Default: app/api/grafana/[...path]/route.ts
❌ Wrong:   app/api/grafana/[...path]/route.js
❌ Wrong:   app/api/grafana/route.ts
❌ Wrong:   app/grafana/[...path]/route.ts
```

2. **Check params await (Next.js 15+):**
```typescript
// ✅ Correct (Next.js 15+)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const pathParams = await params
  return handleGrafanaProxy(request, config, pathParams.path)
}
```

3. **Check path extraction:**
```typescript
console.log('Path params:', await params) // Shape: { path: [...] }
```

---

### Docker networking issues

**Symptoms:**
- "Connection refused" errors
- "getaddrinfo ENOTFOUND" errors
- Next.js can't reach Grafana

**Possible Causes:**
1. Containers not on same network
2. Wrong service name used
3. localhost used instead of service name

**Solutions:**

1. **Check docker-compose.yml:**
```yaml
services:
  grafana:
    image: grafana/grafana:11.6.5
    networks:
      - app-network

  your-app:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

2. **Use service name, not localhost:**
```bash
# ❌ WRONG
GRAFANA_INTERNAL_URL=http://localhost:3000

# ✅ CORRECT
GRAFANA_INTERNAL_URL=http://grafana:3000
```

3. **Test network connectivity:**
```bash
# From inside your app container
docker compose exec your-app ping grafana
docker compose exec your-app curl http://grafana:3000
```

4. **Check container logs:**
```bash
docker compose logs grafana
docker compose logs your-app
```

---

### Grafana configuration errors

**Symptoms:**
- Grafana won't start
- Auth-proxy not working
- Dashboard shows errors

**Possible Causes:**
1. Invalid INI syntax
2. Wrong configuration values
3. Missing required settings

**Solutions:**

1. **Check Grafana logs:**
```bash
docker compose logs grafana | grep -i error
```

2. **Verify configuration file:**
```bash
# Check file syntax
docker compose run grafana grafana-server --help
```

3. **Recommended baseline configuration:**
```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true  # Use true when serving from sub-path
allow_embedding = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
auto_sign_up = true
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true  # Optional: enables login token/cookie flow

[security]
allow_embedding = true
cookie_samesite = none
cookie_secure = true

[auth]
disable_login_form = true
```

4. **Test Grafana directly:**
```bash
# Open Grafana in browser
# Check that it loads
# Check settings > auth proxies > enabled
```

---

## Getting Help

If you're still stuck:

1. **Check the examples** - See `examples/` directory for working code
2. **Read the docs** - Review [README.md](./README.md) for configuration
3. **Check GitHub Issues** - Search for similar problems
4. **Create a minimal reproduction** - Isolate the issue
5. **Open a GitHub Issue** - Include:
   - Next.js version
   - Grafana version
   - Error messages (full stack traces)
   - Code snippets (route handler, component)
   - Grafana config (redacted)
   - Steps to reproduce

---

## Common Error Messages

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| `Unauthorized` | User not authenticated | Check auth logic, session cookie |
| `Invalid Grafana URL` | `GRAFANA_INTERNAL_URL` is wrong | Check environment variable |
| `ECONNREFUSED` | Grafana not running | Check docker compose, start Grafana |
| `ENOTFOUND` | Wrong Grafana hostname | Use service name, not localhost |
| `404 Not Found` | Wrong route/prefix alignment | Use default `/api/grafana/[...path]` or align custom path with `pathPrefix` + Grafana `root_url` |
| `Mixed Content` | HTTP/HTTPS mismatch | Match protocols |
| `CORS blocked` | CORS not configured | Check Grafana config |

---

## Debug Mode

Enable debug logging:

```typescript
// In your route handler
const grafanaUrl = process.env.GRAFANA_INTERNAL_URL

if (!grafanaUrl) {
  throw new Error('Missing GRAFANA_INTERNAL_URL')
}

const response = await handleGrafanaProxy(request, {
  grafanaUrl,
  userEmail: user.email,
  userRole: user.role,
}, (await params).path)

// Add this for debugging:
console.log('Response status:', response.status)
console.log('Response headers:', Object.fromEntries(response.headers))
```

```bash
# Set NODE_ENV=development in .env
NODE_ENV=development
```

---

## Checklist Before Asking for Help

- [ ] Read this entire troubleshooting guide
- [ ] Checked browser console for errors
- [ ] Checked server terminal for errors
- [ ] Verified Next.js version >= 15.0.0
- [ ] Verified route path/prefix alignment (`/api/grafana/[...path]/route.ts` by default)
- [ ] Verified `GRAFANA_INTERNAL_URL` is set correctly
- [ ] Tested Grafana directly (works without proxy?)
- [ ] Tested with hardcoded user (auth works?)
- [ ] Checked Grafana logs
- [ ] Checked Docker networking
- [ ] Checked Grafana config file
- [ ] Reviewed working examples in `examples/`

---

**Still having issues?** Open a [GitHub Issue](https://github.com/joe-byounghern-kim/next-grafana-auth/issues) with all the information above.
