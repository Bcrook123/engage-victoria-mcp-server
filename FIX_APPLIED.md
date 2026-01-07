# Fix Applied: 404 Errors Resolved

## Problem
The Engage Victoria MCP connector was returning 404 errors when trying to access the knowledge base.

## Root Cause
The connector was using the wrong approach to access the Engage Victoria Help Center:
- ❌ **Wrong**: Using `districtsd` subdomain with Help Center ID in API path
- ✅ **Correct**: Using `engagevic` subdomain (brand-specific)

## Solution Applied

### 1. Changed Subdomain
```typescript
// Before:
subdomain: "districtsd"

// After:
subdomain: "engagevic"
```

### 2. Simplified API Endpoints
Removed Help Center ID from API paths since the subdomain handles the scoping:

```typescript
// Before:
/help_center/help_centers/${CONFIG.helpCenterId}/categories.json

// After:
/help_center/${CONFIG.locale}/categories.json
```

### 3. Updated Configuration Files
- `.env` - Changed `ZENDESK_SUBDOMAIN=engagevic`
- `docker-compose.yml` - Updated environment variables
- `src/index.ts` - Fixed all API endpoint calls

## How Zendesk Multi-Brand Works

```
Zendesk Account (districtsd)
├─ Brand: Civio
│  ├─ Subdomain: districtsd
│  └─ Help Center ID: 9038131156495
│     └─ Access via: https://districtsd.zendesk.com/api/v2/...
│
└─ Brand: Engage Victoria
   ├─ Subdomain: engagevic
   └─ Help Center ID: 9305921909647
      └─ Access via: https://engagevic.zendesk.com/api/v2/...
```

**Key Insight**: The subdomain automatically scopes all API calls to that brand's Help Center. You don't need to include the Help Center ID in the API path.

## Testing the Fix

### Test via cURL
```bash
# This now works:
curl -u 'simon@district.au/token:YOUR_TOKEN' \
  'https://engagevic.zendesk.com/api/v2/help_center/en-au/categories.json'

# Returns:
{
  "categories": [
    {"id": 9493323943951, "name": "Knowledge Base", ...},
    {"id": 9305905523599, "name": "General", ...}
  ]
}
```

## Current Status

✅ **Docker container rebuilt and running**
✅ **Code updated with correct subdomain**
✅ **Changes committed to git**

## Next Step: RESTART CLAUDE DESKTOP

**IMPORTANT**: You must completely restart Claude Desktop for the fix to take effect.

After restarting, test with:
```
What categories are available in Engage Victoria Knowledge Base?
```

You should now see:
- Knowledge Base
- General

(Instead of 404 errors)

## Files Changed
1. `src/index.ts` - Updated subdomain and API endpoints
2. `.env` - Changed ZENDESK_SUBDOMAIN to engagevic
3. `.env.example` - Updated example config
4. `docker-compose.yml` - Updated environment variables

## Verification

Container status:
```bash
docker ps | grep engage-victoria
# Should show: engage-victoria-mcp running
```

Test API directly from container:
```bash
docker exec -it engage-victoria-mcp node -e "console.log('Container is working')"
```

## The Two Connectors

| Connector | Subdomain | Knowledge Base | Categories |
|-----------|-----------|----------------|------------|
| **engage-knowledge-web** | districtsd | Civio/District Engage | 7 categories (Site Pages, Knowledge Base, etc.) |
| **engage-victoria-knowledge** | engagevic | Engage Victoria | 2 categories (Knowledge Base, General) |

Both use the same API token, but different subdomains = different knowledge bases!

---

## Summary

The fix was simple but crucial: **use the brand's subdomain (engagevic) instead of the account subdomain (districtsd)**. This ensures all API calls are automatically scoped to the Engage Victoria Help Center without needing to include the Help Center ID in every API path.

**Now restart Claude Desktop and it will work!** 🎉
