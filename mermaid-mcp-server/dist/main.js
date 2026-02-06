#!/usr/bin/env node
/**
 * Entry point for running the MCP server.
 * Run with: npx tsx main.ts --stdio
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
/**
 * Starts an MCP server with stdio transport.
 */
export async function startStdioServer(createServerFn) {
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
