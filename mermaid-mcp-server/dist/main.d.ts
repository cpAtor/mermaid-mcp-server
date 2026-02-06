#!/usr/bin/env node
/**
 * Entry point for running the MCP server.
 * Run with: npx tsx main.ts --stdio
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * Starts an MCP server with stdio transport.
 */
export declare function startStdioServer(createServerFn: () => McpServer): Promise<void>;
