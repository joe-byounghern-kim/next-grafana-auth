#!/bin/bash

# next-grafana-auth Sandbox - Quick Start Script
# This script automates the setup process for testing the package

set -e

echo "========================================="
echo "next-grafana-auth Sandbox Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the sandbox directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Error: Please run this script from the sandbox directory${NC}"
    echo "Usage: cd sandbox && ./quick-start.sh"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo -e "${YELLOW}Error: Node.js is not installed${NC}"
    echo "Install Node.js >= 18.18.0 and retry."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/^v//')
NODE_MAJOR=$(printf '%s' "$NODE_VERSION" | cut -d. -f1)
NODE_MINOR=$(printf '%s' "$NODE_VERSION" | cut -d. -f2)

if [ "$NODE_MAJOR" -lt 18 ] || { [ "$NODE_MAJOR" -eq 18 ] && [ "$NODE_MINOR" -lt 18 ]; }; then
    echo -e "${YELLOW}Error: Node.js >= 18.18.0 is required${NC}"
    echo "Detected Node.js version: $NODE_VERSION"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo -e "${YELLOW}Error: npm is not installed${NC}"
    echo "Install npm and retry."
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo -e "${YELLOW}Error: curl is required for provisioning checks${NC}"
    echo "Install curl and retry."
    exit 1
fi

if command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${YELLOW}Error: Docker Compose is not available${NC}"
    echo "Install Docker Desktop or Docker Compose plugin and retry."
    exit 1
fi

echo -e "${BLUE}Step 1: Starting Grafana...${NC}"
echo ""

if [ "${KEEP_GRAFANA_DATA:-0}" != "1" ]; then
    echo "Resetting Grafana volume to ensure deterministic demo data..."
    $COMPOSE_CMD down -v >/dev/null 2>&1 || true
fi

$COMPOSE_CMD up -d

echo -e "${GREEN}✓ Grafana started${NC}"
echo ""

# Wait for Grafana to be healthy
echo -e "${BLUE}Step 2: Waiting for Grafana to be ready...${NC}"
echo ""

MAX_TRIES=30
TRY=0

while [ $TRY -lt $MAX_TRIES ]; do
    if $COMPOSE_CMD ps | grep -q "healthy"; then
        echo -e "${GREEN}✓ Grafana is healthy!${NC}"
        break
    fi

    TRY=$((TRY+1))
    echo "  Checking health... ($TRY/$MAX_TRIES)"
    sleep 2
done

if [ $TRY -eq $MAX_TRIES ]; then
    echo -e "${YELLOW}Error: Grafana health check timed out${NC}"
    echo "Run '$COMPOSE_CMD logs grafana' and resolve startup errors before retrying."
    exit 1
fi

echo ""

echo -e "${BLUE}Step 2.5: Verifying demo datasource and dashboard...${NC}"
echo ""

GRAFANA_PROXY_URL="http://localhost:3001/api/grafana"
AUTH_USER_HEADER="X-WEBAUTH-USER: demo@example.com"
AUTH_ROLE_HEADER="X-WEBAUTH-ROLE: Viewer"

if ! curl -fsS -H "$AUTH_USER_HEADER" -H "$AUTH_ROLE_HEADER" "$GRAFANA_PROXY_URL/api/health" >/dev/null; then
    echo -e "${YELLOW}Error: Grafana API health check failed through auth-proxy${NC}"
    exit 1
fi

if ! curl -fsS -H "$AUTH_USER_HEADER" -H "$AUTH_ROLE_HEADER" "$GRAFANA_PROXY_URL/api/datasources/uid/testdata" >/dev/null; then
    echo -e "${YELLOW}Error: TestData datasource (uid=testdata) was not provisioned${NC}"
    exit 1
fi

if ! curl -fsS -H "$AUTH_USER_HEADER" -H "$AUTH_ROLE_HEADER" "$GRAFANA_PROXY_URL/api/dashboards/uid/demo-dashboard" >/dev/null; then
    echo -e "${YELLOW}Error: Demo dashboard (uid=demo-dashboard) was not provisioned${NC}"
    exit 1
fi

QUERY_PAYLOAD='{"queries":[{"refId":"A","datasource":{"type":"grafana-testdata-datasource","uid":"testdata"},"scenarioId":"random_walk"}],"from":"now-15m","to":"now"}'
QUERY_RESPONSE=$(curl -fsS -H "Content-Type: application/json" -H "$AUTH_USER_HEADER" -H "$AUTH_ROLE_HEADER" -X POST "$GRAFANA_PROXY_URL/api/ds/query" -d "$QUERY_PAYLOAD")

if ! printf '%s' "$QUERY_RESPONSE" | grep -q '"frames"'; then
    echo -e "${YELLOW}Error: Demo datasource query returned no frames${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Demo data source and dashboard are ready${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Step 3: Installing Node.js dependencies...${NC}"
echo ""

npm ci

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Set up environment variable
echo -e "${BLUE}Step 4: Setting up environment variables...${NC}"
echo ""

if [ ! -f ".env" ]; then
    echo "GRAFANA_INTERNAL_URL=http://localhost:3001" > .env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${YELLOW}Note: .env file already exists${NC}"
fi

echo ""

# Check if Next.js is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Note: Port 3000 is already in use${NC}"
    echo "  Next.js may already be running"
    echo ""
else
    echo -e "${BLUE}Step 5: Starting Next.js development server...${NC}"
    echo ""

    echo -e "${GREEN}Sandbox is ready!${NC}"
    echo ""
    echo "========================================="
    echo "🌐 Access the sandbox at:"
    echo "   http://localhost:3000"
    echo "========================================="
    echo ""
    echo -e "${BLUE}Press Ctrl+C to stop the development server${NC}"
    echo ""

    # Start Next.js
    npm run dev
fi

echo ""
echo -e "${BLUE}To stop Grafana:${NC}"
echo "  $COMPOSE_CMD down"
echo ""
echo -e "${BLUE}To restart Next.js:${NC}"
echo "  npm run dev"
echo ""
