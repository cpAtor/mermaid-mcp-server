/**
 * Mermaid MCP App Server
 *
 * Renders Mermaid diagrams with beautiful-mermaid for supported types,
 * falling back to standard mermaid.js for unsupported types. Provides
 * syntax validation, theme-aware rendering, zoom/pan, drag-select, and
 * fullscreen display via MCP Apps.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export declare function createServer(): McpServer;
