/**
 * Entry point for running the MCP server.
 * Run with: npx tsx main.ts --stdio
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

/**
 * Starts an MCP server with stdio transport.
 */
export async function startStdioServer(
  createServerFn: () => McpServer,
): Promise<void> {
  const server = createServerFn();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Mermaid MCP server running on stdio");
}

async function main() {
  await startStdioServer(createServer);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
