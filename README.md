# Engage Victoria Knowledge MCP Server

A Model Context Protocol (MCP) server that provides access to the Engage Victoria Help Center with always up-to-date information directly from Zendesk.

## Features

- Fetch live content from Engage Victoria Help Center articles
- Search within knowledge base content using Zendesk API
- List all available categories and sections
- Always up-to-date information (no stale cache)
- Optimized for Zendesk Help Center
- Clean text extraction from HTML
- Runs in Docker for easy deployment

## What This Does

This MCP server allows Claude (or any MCP client) to access the Engage Victoria Help Center in real-time using the Zendesk API. It specifically targets the Engage Victoria Help Center (ID: 9305921909647), separate from the Civio/District Engage knowledge base.

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/Bcrook123/engage-victoria-mcp-server.git
cd engage-victoria-mcp-server
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```bash
ZENDESK_EMAIL=simon@district.au
ZENDESK_API_TOKEN=your-api-token-here
```

**Security Note**: Never commit the `.env` file to git. It's already in `.gitignore`.

### 3. Build and Run with Docker

```bash
docker-compose up -d --build
```

This will:
- Build the Docker image
- Start the container in the background
- Make the MCP server available for Claude Desktop

### 4. Configure Claude Desktop

Add this to your Claude Desktop config file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "engage-victoria-knowledge": {
      "command": "docker",
      "args": ["exec", "-i", "engage-victoria-mcp", "node", "/app/dist/index.js"]
    }
  }
}
```

**Note**: If you already have the Civio connector configured, your config will look like this:

```json
{
  "mcpServers": {
    "engage-knowledge-web": {
      "command": "docker",
      "args": ["exec", "-i", "civio-mcp", "node", "/app/dist/index.js"]
    },
    "engage-victoria-knowledge": {
      "command": "docker",
      "args": ["exec", "-i", "engage-victoria-mcp", "node", "/app/dist/index.js"]
    }
  }
}
```

### 5. Restart Claude Desktop

After adding the configuration, restart Claude Desktop completely.

## Manual Setup (Non-Docker)

If you prefer to run without Docker:

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Server

```bash
npm run build
```

### 3. Configure Claude Desktop

```json
{
  "mcpServers": {
    "engage-victoria-knowledge": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/engage-victoria-mcp-server/dist/index.js"],
      "env": {
        "ZENDESK_EMAIL": "simon@district.au",
        "ZENDESK_API_TOKEN": "your-api-token-here",
        "ZENDESK_HELP_CENTER_ID": "9305921909647"
      }
    }
  }
}
```

## Verifying Installation

Once configured, test it by asking Claude:

- "What categories are available in Engage Victoria Knowledge Base?"
- "Search for community engagement in Engage Victoria"
- "List the Engage Victoria help center sections"

## Available Tools

### list_categories

Lists all available categories and sections in Engage Victoria Knowledge Base.

**Parameters:** None

**Example:**
```
What categories are available in Engage Victoria?
```

### fetch_article

Fetches the latest content from a specific knowledge base article by ID.

**Parameters:**
- `article_id` (required): The Zendesk article ID

**Example:**
```
Fetch article 123456789 from Engage Victoria
```

### search_content

Searches for articles within Engage Victoria Knowledge Base using the Zendesk search API.

**Parameters:**
- `query` (required): Search term or topic

**Example:**
```
Search for "project planning" in Engage Victoria knowledge base
```

## Docker Management

### View Logs

```bash
docker-compose logs -f
```

### Stop the Container

```bash
docker-compose down
```

### Restart the Container

```bash
docker-compose restart
```

### Rebuild After Changes

```bash
docker-compose up -d --build
```

## Troubleshooting

### Container not starting

Check the logs:
```bash
docker-compose logs
```

### API credentials not working

Verify your credentials:
```bash
docker exec -it engage-victoria-mcp env | grep ZENDESK
```

### Claude Desktop can't connect

1. Ensure the container is running: `docker ps`
2. Restart Claude Desktop completely
3. Check Claude Desktop logs for connection errors

## Key Differences from Civio Connector

- **Help Center ID**: 9305921909647 (Engage Victoria) vs 9038131156495 (Civio)
- **API Endpoints**: All API calls are scoped to Engage Victoria Help Center
- **Container Name**: `engage-victoria-mcp` (different from `civio-mcp`)
- **Server Name**: `engage-victoria-knowledge` (different from `engage-knowledge-web`)

## Security Notes

**IMPORTANT:**
- This is a **private repository** - only authorized District team members should have access
- Zendesk credentials are required
- API tokens should be treated as passwords - keep them secure!
- Never commit `.env` files to git
- Use environment variables for sensitive data

## Technical Architecture

- **Help Center ID**: Hardcoded to 9305921909647 (Engage Victoria)
- **Same API Token**: Uses the same Zendesk credentials as Civio
- **Separate Instance**: Runs as a completely independent MCP server
- **API Scoping**: All Zendesk API calls explicitly target the EV Help Center

## License

MIT
