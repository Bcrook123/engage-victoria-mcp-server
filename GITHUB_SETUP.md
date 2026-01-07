# GitHub Repository Setup Instructions

## Step 1: Create the GitHub Repository

1. Go to: **https://github.com/new**
2. Fill in the details:
   - **Owner**: Bcrook123
   - **Repository name**: `engage-victoria-mcp-server`
   - **Description**: `MCP server for accessing Engage Victoria Help Center with real-time Zendesk API integration`
   - **Visibility**: ✅ **Private** (IMPORTANT!)
   - **DO NOT** check "Initialize this repository with:"
     - ❌ Do not add README
     - ❌ Do not add .gitignore
     - ❌ Do not add license
3. Click **"Create repository"**

## Step 2: Push Your Code

After creating the repository, GitHub will show you some commands. **Ignore those** and run these commands instead:

```bash
cd ~/engage-victoria-mcp-server
git push -u origin main
```

You may be prompted to authenticate. If so:
- **Option 1**: Enter your GitHub username and Personal Access Token (not password)
- **Option 2**: Use GitHub's authentication prompt in your browser

### If You Need a Personal Access Token

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `MCP Server Deploy`
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Use this token as your password when pushing

## Step 3: Verify the Push

After pushing, verify by visiting:
```
https://github.com/Bcrook123/engage-victoria-mcp-server
```

You should see all your files including:
- README.md
- Dockerfile
- docker-compose.yml
- src/index.ts
- package.json
- etc.

## Step 4: Share with Team Members

Once the repository is on GitHub, team members can set it up by following the README.md instructions:

### Quick Setup for Team Members

```bash
# Clone the repository
git clone https://github.com/Bcrook123/engage-victoria-mcp-server.git
cd engage-victoria-mcp-server

# Create .env file with credentials
cat > .env << 'EOF'
ZENDESK_EMAIL=simon@district.au
ZENDESK_API_TOKEN=your-api-token-here
ZENDESK_SUBDOMAIN=engagevic
ZENDESK_LOCALE=en-au
ZENDESK_SITE_NAME=Engage Victoria Knowledge
EOF

# Build and start the Docker container
docker-compose up -d --build

# Configure Claude Desktop
# Add to: ~/Library/Application Support/Claude/claude_desktop_config.json
```

Then they add this to their Claude Desktop config:

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

## Security Reminders

⚠️ **IMPORTANT**:
- The repository is **PRIVATE** - only add authorized team members
- **NEVER** commit the `.env` file (it's in `.gitignore`)
- Share API credentials securely (not via email/Slack)
- Each team member needs the Zendesk API token to set up their local instance

## Repository Structure

```
engage-victoria-mcp-server/
├── README.md              # Main documentation
├── SETUP_COMPLETE.md      # Initial setup summary
├── FIX_APPLIED.md         # Troubleshooting documentation
├── GITHUB_SETUP.md        # This file
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose setup
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore rules
└── src/
    └── index.ts           # Main MCP server code
```

## Troubleshooting

### Authentication Failed

If you get "Authentication failed" when pushing:

1. **Check your credentials**: Make sure you're using a Personal Access Token, not your GitHub password
2. **Update stored credentials**:
   ```bash
   git config --global credential.helper osxkeychain
   git push -u origin main
   # Enter username and token when prompted
   ```

### Repository Already Exists

If the repository already exists on GitHub but is empty:

```bash
cd ~/engage-victoria-mcp-server
git push -u origin main
```

### Push Rejected

If you get "push rejected" errors:

```bash
cd ~/engage-victoria-mcp-server
git pull origin main --rebase
git push -u origin main
```

## Next Steps After Pushing

1. ✅ Verify the repository is accessible at: https://github.com/Bcrook123/engage-victoria-mcp-server
2. ✅ Add team members to the repository (Settings → Collaborators)
3. ✅ Share the setup instructions with team members
4. ✅ Provide them with the Zendesk API credentials securely

---

**Ready to push?** Just follow Steps 1-3 above! 🚀
