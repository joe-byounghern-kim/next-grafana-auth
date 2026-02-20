# Grafana Test Instance

This directory contains a pre-configured Grafana 11.6 instance for testing the `next-grafana-auth` examples.

## Quick Start

1. **Start Grafana:**
```bash
docker compose up -d
```

2. **Verify Grafana is running:**
```bash
# Check logs
docker compose logs -f grafana

# Or check health
curl http://localhost:3001/api/health
```

3. **Stop Grafana:**
```bash
docker compose down
```

4. **Stop and remove data:**
```bash
docker compose down -v
```

## Configuration

The Grafana instance is pre-configured with:

- **Auth-proxy enabled:** Ready for use with `next-grafana-auth`
- **Sub-path routing:** `/api/grafana` (required for proxy)
- **Embedding enabled:** Dashboards can be embedded in iframes
- **Auto sign-up:** New users are created automatically
- **Role mapping:** X-WEBAUTH-ROLE header maps to Grafana roles
- **Demo dashboard:** 5 panels (time series, stat, gauge, bar chart, bar gauge) using the built-in TestData datasource — generates live mock data on any machine with no external dependencies

### Environment Variables

| Variable | Value | Description |
|----------|--------|-------------|
| `GF_SERVER_ROOT_URL` | `%(protocol)s://%(domain)s:%(http_port)s/api/grafana` | Base URL with sub-path |
| `GF_SERVER_SERVE_FROM_SUB_PATH` | `true` | Enable sub-path routing |
| `GF_SECURITY_ALLOW_EMBEDDING` | `true` | Allow iframe embedding |
| `GF_AUTH_PROXY_ENABLED` | `true` | Enable auth-proxy |
| `GF_AUTH_PROXY_HEADER_NAME` | `X-WEBAUTH-USER` | Header for user email |
| `GF_AUTH_PROXY_HEADER_PROPERTY` | `username` | Header property |
| `GF_AUTH_PROXY_AUTO_SIGN_UP` | `true` | Auto-create users |
| `GF_AUTH_PROXY_ENABLE_LOGIN_TOKEN` | `true` | Enable login tokens |
| `GF_AUTH_DISABLE_LOGIN_FORM` | `true` | Disable Grafana login |

## Accessing Grafana

### Direct Access (for debugging)

```
http://localhost:3001/api/grafana
```

Since auth-proxy is enabled and the login form is disabled, you'll need to access Grafana through the Next.js proxy:

```
http://localhost:3000/dashboard
```

### Using the Proxy

Start one of the examples:

```bash
cd examples/basic
npm ci
bun run dev
```

Then visit: `http://localhost:3000/dashboard`

## Troubleshooting

### Grafana won't start

Check logs:
```bash
docker compose logs grafana
```

Common issues:
- Port 3001 already in use
- Volume permissions (on Linux)
- Memory constraints

### Can't access Grafana

1. Check container is running:
```bash
docker compose ps
```

2. Check health:
```bash
curl http://localhost:3001/api/health
```

3. Check logs for errors:
```bash
docker compose logs grafana | grep -i error
```

### Proxy errors

1. Verify `GRAFANA_INTERNAL_URL` is set correctly:
```bash
echo $GRAFANA_INTERNAL_URL
# Should be: http://localhost:3001 (host-run Next.js)
```

2. Check Next.js can reach Grafana:
```bash
# From your Next.js app directory
curl http://localhost:3001/api/health
```

3. Verify auth-proxy headers are being set:
- Add logging to your proxy route
- Check browser DevTools > Network
- Look for X-WEBAUTH-USER and X-WEBAUTH-ROLE headers

## Data Persistence

By default, Grafana data is stored in a Docker volume named `grafana-data`. This means:

- ✅ Data persists across container restarts
- ✅ Dashboard configurations are saved
- ✅ Users and settings persist
- ❌ Data is lost if you run `docker compose down -v`

**To save custom configuration:**

1. Add a custom `grafana.ini`:
```ini
[server]
root_url = %(protocol)s://%(domain)s:%(http_port)s/api/grafana
serve_from_sub_path = true
allow_embedding = true

[auth.proxy]
enabled = true
header_name = X-WEBAUTH-USER
header_property = username
auto_sign_up = true
headers = Role:X-WEBAUTH-ROLE
enable_login_token = true
```

2. Mount it in docker-compose.yml:
```yaml
volumes:
  - ./grafana.ini:/etc/grafana/grafana.ini:ro
```

3. Restart Grafana:
```bash
docker compose down
docker compose up -d
```

## Customization

### Change Grafana Version

Edit `docker-compose.yml`:
```yaml
services:
  grafana:
    image: grafana/grafana:11.7.0  # Change version
```

### Add Data Sources

Access Grafana through your proxy and configure data sources in the UI.

### Pre-load Dashboards

1. Create dashboards in Grafana UI (via proxy)
2. Export dashboard JSON
3. Use Grafana provisioning (advanced):

```yaml
# docker-compose.yml
volumes:
  - ./provisioning:/etc/grafana/provisioning
```

```bash
# provisioning/dashboards/dashboard.yml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

## Networking

The Grafana container uses a custom network named `grafana-network`. Your Next.js app needs to be on the same network to access Grafana via `http://grafana:3000`.

**If your app is in a different docker-compose file:**

```yaml
services:
  your-app:
    networks:
      - grafana-network
      - your-app-network

networks:
  grafana-network:
    external: true
  your-app-network:
    driver: bridge
```

## Security Notes

⚠️ **This configuration is for development/testing only!**

For production:

1. **Enable HTTPS:**
   - Use reverse proxy (nginx, Traefik)
   - Configure SSL certificates
   - Update `GF_SERVER_ROOT_URL` to use `https://`

2. **Secure Auth-Proxy:**
   - Verify TLS certificates
   - Validate all headers
   - Implement rate limiting
   - Add IP whitelisting

3. **Grafana Security:**
   - Set strong admin password (if login is enabled)
   - Configure authentication providers
   - Enable audit logging
   - Regularly update Grafana

4. **Network Security:**
   - Don't expose Grafana directly
   - Only expose through Next.js proxy
   - Use firewall rules
   - Isolate Grafana in private network

## Monitoring

### Check Grafana Health

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"commit":"abc123","database":"ok","version":"11.6.5"}
```

### View Logs

```bash
# All logs
docker compose logs -f grafana

# Errors only
docker compose logs grafana | grep -i error

# Real-time logs
docker compose logs -f --tail=100 grafana
```

### Container Stats

```bash
docker stats grafana
```

## Cleanup

### Remove containers and networks
```bash
docker compose down
```

### Remove everything (including data)
```bash
docker compose down -v
docker system prune -a
```

## Version Compatibility

This docker-compose is tested with:

- Grafana: 11.6.5
- Docker: 20.10+
- Docker Compose: 2.0+

**Next-grafana-auth requires:**
- Grafana >= 11.6 (auth-proxy stable)
- Next.js >= 15.0
- React >= 18.0

## Support

For issues specific to Grafana:
- [Grafana Documentation](https://grafana.com/docs/)
- [Grafana GitHub Issues](https://github.com/grafana/grafana/issues)

For issues with `next-grafana-auth`:
- See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- Open a [GitHub Issue](https://github.com/joe-byounghern-kim/next-grafana-auth/issues)
