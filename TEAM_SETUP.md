# Team Member Setup Guide

Quick setup guide for team members who need to install the Engage Victoria MCP connector.

## Prerequisites

- Docker installed and running
- Claude Desktop installed
- Access to this private repository
- Zendesk API credentials (get from team lead)

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/Bcrook123/engage-victoria-mcp-server.git
cd engage-victoria-mcp-server
```

### 2. Create Your Environment File

Create a `.env` file with the credentials:

```bash
cat > .env << 'EOF'
ZENDESK_EMAIL=simon@district.au
ZENDESK_API_TOKEN=your-api-token-here
ZENDESK_SUBDOMAIN=engagevic
ZENDESK_LOCALE=en-au
ZENDESK_SITE_NAME=Engage Victoria Knowledge
EOF
```

**⚠️ Replace `your-api-token-here` with the actual API token provided by your team lead.**

### 3. Start the Docker Container

```bash
docker-compose up -d --build
```

This will:
- Download the Node.js Docker image (if needed)
- Install dependencies
- Build the TypeScript code
- Start the MCP server in the background

Verify it's running:
```bash
docker ps | grep engage-victoria
```

You should see a container named `engage-victoria-mcp` running.

### 4. Configure Claude Desktop

#### Find Your Config File

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

#### Add the Connector

Open the config file and add the `engage-victoria-knowledge` connector:

```json
{
  "mcpServers": {
    "engage-victoria-knowledge": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "engage-victoria-mcp",
        "node",
        "/app/dist/index.js"
      ]
    }
  }
}
```

**If you already have other MCP servers configured**, just add the `engage-victoria-knowledge` entry to your existing `mcpServers` object. For example:

```json
{
  "mcpServers": {
    "engage-knowledge-web": {
      "command": "docker",
      "args": ["...existing config..."]
    },
    "engage-victoria-knowledge": {
      "command": "docker",
      "args": [
        "exec",
        "-i",
        "engage-victoria-mcp",
        "node",
        "/app/dist/index.js"
      ]
    }
  }
}
```

### 5. Restart Claude Desktop

**Important**: Completely quit and restart Claude Desktop for the changes to take effect.

## Testing the Connector

After restarting Claude Desktop, test the connector by asking Claude:

```
What categories are available in Engage Victoria Knowledge Base?
```

You should see:
- Knowledge Base
- General

If you see these categories, the connector is working! ✅

## Troubleshooting

### Container Not Running

Check if the container is running:
```bash
docker ps | grep engage-victoria
```

If not, check the logs:
```bash
docker logs engage-victoria-mcp
```

Restart the container:
```bash
cd ~/engage-victoria-mcp-server
docker-compose restart
```

### Claude Can't Connect to the Connector

1. **Verify the container is running**:
   ```bash
   docker ps | grep engage-victoria
   ```

2. **Check the container name is correct**:
   The container must be named `engage-victoria-mcp` (this is set in docker-compose.yml)

3. **Restart Claude Desktop completely**:
   Make sure you fully quit and restart Claude Desktop, not just close the window

4. **Check the config file syntax**:
   Make sure your `claude_desktop_config.json` is valid JSON (no trailing commas, all brackets matched)

### API Errors / 404s

This usually means the API credentials are wrong or missing:

1. Check your `.env` file has the correct token
2. Verify the token hasn't expired
3. Restart the container after changing `.env`:
   ```bash
   docker-compose restart
   ```

### Getting "dotenv" Warning

This warning is cosmetic and doesn't affect functionality, but if you want to suppress it:

1. Make sure you have the latest code: `git pull`
2. Rebuild the container: `docker-compose up -d --build`
3. Restart Claude Desktop

## Managing the Container

### View Logs
```bash
docker logs -f engage-victoria-mcp
```

### Stop the Container
```bash
cd ~/engage-victoria-mcp-server
docker-compose down
```

### Start the Container
```bash
cd ~/engage-victoria-mcp-server
docker-compose up -d
```

### Restart After Code Changes
```bash
cd ~/engage-victoria-mcp-server
git pull
docker-compose up -d --build
```

## Security Best Practices

- ✅ Keep your `.env` file secure (it's in .gitignore)
- ✅ Never commit API credentials to git
- ✅ Don't share credentials via email/Slack
- ✅ Only clone the repository on trusted computers
- ✅ Keep Docker updated

## Available Tools

Once configured, Claude can use these tools:

### list_categories
Lists all categories in Engage Victoria KB

### search_content
Search for articles by keyword

### fetch_article
Get the full content of a specific article by ID

## Getting Help

If you run into issues:

1. Check this troubleshooting guide
2. Review the main [README.md](README.md)
3. Check the [FIX_APPLIED.md](FIX_APPLIED.md) for known issues
4. Ask your team lead for assistance

## Quick Reference

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start the container |
| `docker-compose down` | Stop the container |
| `docker-compose restart` | Restart the container |
| `docker-compose up -d --build` | Rebuild and restart |
| `docker ps` | Check if container is running |
| `docker logs engage-victoria-mcp` | View container logs |
| `git pull` | Get latest code updates |

---

**Questions?** Contact your team lead or check the repository Issues section.
