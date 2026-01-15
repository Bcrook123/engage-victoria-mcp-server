#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// API Configuration from environment variables
const CONFIG = {
  apiBase: process.env.KB_API_URL || "https://ev-kb.doghouse.cloud",
  siteName: process.env.KB_SITE_NAME || "Engage Victoria Knowledge",
};

interface FetchArticleArgs {
  article_slug: string;
}

interface SearchContentArgs {
  query: string;
}

interface Article {
  id: number;
  title: string;
  summary: string;
  slug: string;
  body: string;
}

interface ApiResponse {
  data: Article[];
}

// Helper function to make API requests
async function apiRequest(endpoint: string): Promise<any> {
  const url = `${CONFIG.apiBase}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Strip HTML tags from article body
function stripHtml(html: string): string {
  if (!html) return '';
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

// Fetch a specific article by slug
async function fetchArticle(articleSlug: string): Promise<string> {
  try {
    const data = await apiRequest(`/articles/${articleSlug}`);

    // Handle both single article response and array response
    const article: Article = data.data ? (Array.isArray(data.data) ? data.data[0] : data.data) : data;

    if (!article) {
      throw new Error(`Article not found: ${articleSlug}`);
    }

    const cleanBody = stripHtml(article.body);
    const articleUrl = `${CONFIG.apiBase}/articles/${article.slug}`;

    return `# ${article.title}\n\nArticle ID: ${article.id}\nSlug: ${article.slug}\nURL: ${articleUrl}\n\n${cleanBody}`;
  } catch (error) {
    throw new Error(`Failed to fetch article: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// List all articles (replaces list_categories)
async function listArticles(): Promise<string> {
  try {
    const data: ApiResponse = await apiRequest('/articles');
    const articles: Article[] = data.data;

    if (!articles || articles.length === 0) {
      return `No articles found in the ${CONFIG.siteName}.`;
    }

    let output = `# ${CONFIG.siteName} - Available Articles\n\n`;
    output += `Found ${articles.length} article(s):\n\n`;

    for (const article of articles) {
      output += `## ${article.title}\n`;
      output += `Slug: ${article.slug}\n`;
      if (article.summary) {
        output += `Summary: ${stripHtml(article.summary).substring(0, 200)}...\n`;
      }
      output += `\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Failed to list articles: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Search for articles
async function searchArticles(query: string): Promise<string> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const data: ApiResponse = await apiRequest(`/articles?q=${encodedQuery}`);
    const results: Article[] = data.data;

    if (!results || results.length === 0) {
      return `No articles found for "${query}" in ${CONFIG.siteName}.`;
    }

    let output = `# Search Results for "${query}"\n\nFound ${results.length} article(s) in ${CONFIG.siteName}:\n\n`;

    for (const article of results) {
      output += `## ${article.title}\n`;
      output += `Slug: ${article.slug}\n`;
      output += `URL: ${CONFIG.apiBase}/articles/${article.slug}\n`;
      if (article.summary) {
        output += `Preview: ${stripHtml(article.summary).substring(0, 300)}...\n`;
      }
      output += `\n`;
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
    version: "2.0.0",
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
    name: "list_articles",
    description: `List all available articles in ${CONFIG.siteName}. Use this to discover what help articles are available.`,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "fetch_article",
    description: `Fetch and return the full content of a specific article by its slug from ${CONFIG.siteName}. Use this to get the complete, up-to-date content of an article.`,
    inputSchema: {
      type: "object",
      properties: {
        article_slug: {
          type: "string",
          description: "The article slug (e.g., '9175641395215-Settings' - can be found in the article URL or from search results)",
        },
      },
      required: ["article_slug"],
    },
  },
  {
    name: "search_content",
    description: `Search for articles in ${CONFIG.siteName}. Returns matching articles with previews and slugs.`,
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
    if (name === "list_articles" || name === "list_categories") {
      const articles = await listArticles();

      return {
        content: [
          {
            type: "text",
            text: articles,
          },
        ],
      };
    }

    if (name === "fetch_article") {
      if (!args || typeof args !== 'object' || !('article_slug' in args)) {
        throw new Error("Missing required parameter: article_slug");
      }
      const { article_slug } = args as unknown as FetchArticleArgs;
      const content = await fetchArticle(article_slug);

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
  console.error(`${CONFIG.siteName} MCP Server running on stdio (API: ${CONFIG.apiBase})`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
