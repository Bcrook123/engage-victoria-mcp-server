# Engage Victoria MCP Server - Setup Complete

## What Was Done

✅ Created a separate Docker-based MCP server for Engage Victoria Help Center
✅ Identified the EV Help Center ID: **9305921909647**
✅ Built and deployed the Docker container
✅ Updated Claude Desktop configuration with both connectors

## Current Status

### Docker Container
- **Container Name**: `engage-victoria-mcp`
- **Image**: `engage-victoria-mcp-server-engage-victoria-mcp`
- **Status**: Running
- **Help Center ID**: 9305921909647 (Engage Victoria)

### GitHub Repository
- **Local Path**: `/Users/bencrook/engage-victoria-mcp-server`
- **Committed**: Yes
- **Next Step**: You need to create the GitHub repo and push manually

## Next Steps

### 1. Create GitHub Repository

You'll need to create the GitHub repository manually because `gh` CLI is not installed:

1. Go to https://github.com/new
2. Create a new **private** repository named: `engage-victoria-mcp-server`
3. Description: "MCP server for accessing Engage Victoria Help Center with real-time Zendesk API integration"
4. **DO NOT** initialize with README, .gitignore, or license (already exists locally)

### 2. Push to GitHub

After creating the repo, run:

```bash
cd ~/engage-victoria-mcp-server
git remote add origin https://github.com/Bcrook123/engage-victoria-mcp-server.git
git push -u origin main
```

If authentication fails, you'll need to use a Personal Access Token:
- Go to GitHub Settings → Developer settings → Personal access tokens
- Generate a new token with `repo` scope
- Use the token as your password when pushing

### 3. Restart Claude Desktop

**IMPORTANT**: You must restart Claude Desktop for the new connector to be recognized.

After restart, Claude will have access to TWO separate knowledge bases:
- **engage-knowledge-web** → Civio/District Engage KB
- **engage-victoria-knowledge** → Engage Victoria KB

## Testing the Connectors

Once Claude Desktop restarts, test both connectors:

### Test Civio Connector
```
What categories are in the Engage Knowledge Web?
```

### Test EV Connector
```
What categories are in Engage Victoria Knowledge Base?
```

You should see different results from each, confirming they're accessing separate Help Centers.

## Key Differences Between Connectors

| Feature | Civio Connector | EV Connector |
|---------|----------------|--------------|
| **Server Name** | engage-knowledge-web | engage-victoria-knowledge |
| **Help Center ID** | 9038131156495 | 9305921909647 |
| **Container Name** | engage-knowledge-web | engage-victoria-mcp |
| **Docker Method** | `docker run --rm` | `docker exec` on persistent container |
| **Knowledge Base** | District Engage | Engage Victoria |

## Container Management

### View EV Container Logs
```bash
docker logs -f engage-victoria-mcp
```

### Stop EV Container
```bash
cd ~/engage-victoria-mcp-server
docker-compose down
```

### Start EV Container
```bash
cd ~/engage-victoria-mcp-server
docker-compose up -d
```

### Rebuild After Changes
```bash
cd ~/engage-victoria-mcp-server
docker-compose up -d --build
```

### Check Container Status
```bash
docker ps | grep engage
```

## Configuration Files

### Claude Desktop Config
**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Both connectors are now configured:
- Civio uses `docker run --rm` (ephemeral)
- EV uses `docker exec` (persistent container)

### Environment Variables
**Location**: `/Users/bencrook/engage-victoria-mcp-server/.env`

Contains:
- ZENDESK_EMAIL
- ZENDESK_API_TOKEN
- ZENDESK_HELP_CENTER_ID (hardcoded to EV)
- ZENDESK_SUBDOMAIN
- ZENDESK_LOCALE

**NOTE**: `.env` is gitignored for security

## Troubleshooting

### Container Not Running
```bash
cd ~/engage-victoria-mcp-server
docker-compose up -d
```

### Claude Can't Connect
1. Ensure container is running: `docker ps`
2. Restart Claude Desktop completely
3. Check container logs: `docker logs engage-victoria-mcp`

### Need to Update Code
1. Make changes to `src/index.ts`
2. Rebuild: `docker-compose up -d --build`
3. Restart Claude Desktop

## Security Reminders

- API credentials are in `.env` (gitignored)
- Repository should be **private**
- Never commit `.env` files
- API token is shared between both connectors (same Zendesk account)

## Architecture Summary

```
Zendesk Account (districtsd)
├─ Brand: Civio (Help Center ID: 9038131156495)
│  └─ Connector: engage-knowledge-web
│     └─ Docker: docker run --rm (ephemeral)
│
└─ Brand: Engage Victoria (Help Center ID: 9305921909647)
   └─ Connector: engage-victoria-knowledge
      └─ Docker: docker exec engage-victoria-mcp (persistent)
```

## Success!

You now have two separate MCP connectors running in Docker:
1. ✅ Civio/District Engage Knowledge Base
2. ✅ Engage Victoria Knowledge Base

Both use the same API credentials but target different Help Center IDs, ensuring Claude can access the correct knowledge base for each brand.
