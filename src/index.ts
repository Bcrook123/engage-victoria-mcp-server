#!/usr/bin/env node

import { config } from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

// Load .env file from the package root (only if running locally, not in Docker)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env");

// Only load .env if it exists (it won't in Docker container)
if (existsSync(envPath)) {
  try {
    config({ path: envPath });
  } catch (error) {
    // Silently ignore dotenv parsing errors - env vars will still load
  }
}

// Zendesk API Configuration from environment variables
const CONFIG = {
  subdomain: process.env.ZENDESK_SUBDOMAIN || "engagevic", // Engage Victoria subdomain
  email: process.env.ZENDESK_EMAIL,
  apiToken: process.env.ZENDESK_API_TOKEN,
  locale: process.env.ZENDESK_LOCALE || "en-au",
  siteName: process.env.ZENDESK_SITE_NAME || "Engage Victoria Knowledge",
};

// Validate required configuration
if (!CONFIG.email || !CONFIG.apiToken) {
  console.error("Error: Missing required environment variables");
  console.error("Please set ZENDESK_EMAIL and ZENDESK_API_TOKEN");
  process.exit(1);
}

// Zendesk API base URL
const ZENDESK_API_BASE = `https://${CONFIG.subdomain}.zendesk.com/api/v2`;

// Create Basic Auth header
const authHeader = `Basic ${Buffer.from(`${CONFIG.email}/token:${CONFIG.apiToken}`).toString('base64')}`;

interface FetchArticleArgs {
  article_id: string;
}

interface SearchContentArgs {
  query: string;
}

interface ZendeskArticle {
  id: number;
  title: string;
  body: string;
  html_url: string;
  section_id: number;
  author_id: number;
}

interface ZendeskSection {
  id: number;
  name: string;
  description: string;
  category_id: number;
  html_url: string;
}

interface ZendeskCategory {
  id: number;
  name: string;
  description: string;
  html_url: string;
}

// Helper function to make Zendesk API requests
async function zendeskApiRequest(endpoint: string): Promise<any> {
  const response = await fetch(`${ZENDESK_API_BASE}${endpoint}`, {
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Zendesk API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Strip HTML tags from article body
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Fetch a specific article by ID from the Engage Victoria Help Center
async function fetchArticle(articleId: string): Promise<string> {
  try {
    const data = await zendeskApiRequest(`/help_center/${CONFIG.locale}/articles/${articleId}.json`);
    const article: ZendeskArticle = data.article;

    const cleanBody = stripHtml(article.body);

    return `# ${article.title}\n\nArticle ID: ${article.id}\nURL: ${article.html_url}\n\n${cleanBody}`;
  } catch (error) {
    throw new Error(`Failed to fetch article: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// List all categories and sections for Engage Victoria Help Center
async function listCategories(): Promise<string> {
  try {
    const data = await zendeskApiRequest(`/help_center/${CONFIG.locale}/categories.json`);
    const categories: ZendeskCategory[] = data.categories;

    if (categories.length === 0) {
      return "No categories found in the Engage Victoria knowledge base.";
    }

    let output = "# Engage Victoria Knowledge Categories\n\n";

    for (const category of categories) {
      output += `## ${category.name}\n`;
      if (category.description) {
        output += `${stripHtml(category.description)}\n`;
      }
      output += `URL: ${category.html_url}\n`;
      output += `Category ID: ${category.id}\n\n`;

      // Get sections for this category
      try {
        const sectionData = await zendeskApiRequest(`/help_center/${CONFIG.locale}/categories/${category.id}/sections.json`);
        const sections: ZendeskSection[] = sectionData.sections;

        if (sections.length > 0) {
          output += "### Sections:\n";
          for (const section of sections) {
            output += `- **${section.name}**`;
            if (section.description) {
              output += ` - ${stripHtml(section.description)}`;
            }
            output += ` (Section ID: ${section.id})\n`;
          }
          output += "\n";
        }
      } catch (err) {
        // Continue even if sections fail
      }
    }

    return output;
  } catch (error) {
    throw new Error(`Failed to list categories: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Search for articles in Engage Victoria Help Center
async function searchArticles(query: string): Promise<string> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const data = await zendeskApiRequest(`/help_center/articles/search.json?query=${encodedQuery}&locale=${CONFIG.locale}`);
    const results: ZendeskArticle[] = data.results;

    if (results.length === 0) {
      return `No articles found for "${query}" in Engage Victoria knowledge base.`;
    }

    let output = `# Search Results for "${query}"\n\nFound ${results.length} article(s) in Engage Victoria:\n\n`;

    for (const article of results) {
      const cleanBody = stripHtml(article.body).substring(0, 300);
      output += `## ${article.title}\n`;
      output += `Article ID: ${article.id}\n`;
      output += `URL: ${article.html_url}\n`;
      output += `Preview: ${cleanBody}...\n\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Failed to search articles: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create server instance
const server = new Server(
  {
    name: "engage-victoria-knowledge",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: "list_categories",
    description: "List all available categories and sections in Engage Victoria Knowledge Base. Use this to discover what topics and help articles are available.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "fetch_article",
    description: "Fetch and return the full content of a specific article by its ID from Engage Victoria Knowledge Base. Use this to get the complete, up-to-date content of an article.",
    inputSchema: {
      type: "object",
      properties: {
        article_id: {
          type: "string",
          description: "The Zendesk article ID (can be found in the article URL or from search results)",
        },
      },
      required: ["article_id"],
    },
  },
  {
    name: "search_content",
    description: "Search for articles in Engage Victoria Knowledge Base. Returns matching articles with previews and IDs.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query or topic to look for",
        },
      },
      required: ["query"],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "list_categories") {
      const categories = await listCategories();

      return {
        content: [
          {
            type: "text",
            text: categories,
          },
        ],
      };
    }

    if (name === "fetch_article") {
      if (!args || typeof args !== 'object' || !('article_id' in args)) {
        throw new Error("Missing required parameter: article_id");
      }
      const { article_id } = args as unknown as FetchArticleArgs;
      const content = await fetchArticle(article_id);

      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    }

    if (name === "search_content") {
      if (!args || typeof args !== 'object' || !('query' in args)) {
        throw new Error("Missing required parameter: query");
      }
      const { query } = args as unknown as SearchContentArgs;
      const results = await searchArticles(query);

      return {
        content: [
          {
            type: "text",
            text: results,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${CONFIG.siteName} MCP Server running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
