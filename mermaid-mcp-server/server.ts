/**
 * Mermaid MCP App Server
 *
 * Renders Mermaid diagrams with beautiful-mermaid for supported types,
 * falling back to standard mermaid.js for unsupported types. Provides
 * syntax validation, theme-aware rendering, zoom/pan, drag-select, and
 * fullscreen display via MCP Apps.
 */

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

const RESOURCE_URI = "ui://mermaid-diagram/mcp-app.html";

/** Diagram types that beautiful-mermaid supports */
const BEAUTIFUL_MERMAID_TYPES = new Set([
  "flowchart",
  "flowchart-v2",
  "graph",
  "stateDiagram",
  "stateDiagram-v2",
  "sequenceDiagram",
  "classDiagram",
  "erDiagram",
]);

/**
 * Detect the Mermaid diagram type from markup text.
 */
function detectDiagramType(markup: string): string {
  const firstLine = markup.trim().split("\n")[0].trim().toLowerCase();

  if (firstLine.startsWith("flowchart") || firstLine.startsWith("graph")) {
    return "flowchart";
  }
  if (firstLine.startsWith("sequencediagram")) return "sequenceDiagram";
  if (firstLine.startsWith("classdiagram")) return "classDiagram";
  if (firstLine.startsWith("statediagram")) return "stateDiagram";
  if (firstLine.startsWith("erdiagram")) return "erDiagram";
  if (firstLine.startsWith("gantt")) return "gantt";
  if (firstLine.startsWith("pie")) return "pie";
  if (firstLine.startsWith("gitgraph")) return "gitGraph";
  if (firstLine.startsWith("mindmap")) return "mindmap";
  if (firstLine.startsWith("timeline")) return "timeline";
  if (firstLine.startsWith("journey")) return "journey";
  if (firstLine.startsWith("quadrantchart")) return "quadrantChart";
  if (firstLine.startsWith("requirementdiagram")) return "requirementDiagram";
  if (firstLine.startsWith("c4context") || firstLine.startsWith("c4container") ||
      firstLine.startsWith("c4component") || firstLine.startsWith("c4dynamic") ||
      firstLine.startsWith("c4deployment")) return "c4";
  if (firstLine.startsWith("sankey")) return "sankey";
  if (firstLine.startsWith("xychart")) return "xyChart";
  if (firstLine.startsWith("block")) return "block";
  if (firstLine.startsWith("packet")) return "packet";
  if (firstLine.startsWith("kanban")) return "kanban";
  if (firstLine.startsWith("architecture")) return "architecture";
  return "unknown";
}

/** Known diagram type keywords. */
const KNOWN_DIAGRAM_KEYWORDS = [
  "flowchart", "graph", "sequencediagram", "classdiagram",
  "statediagram", "erdiagram", "gantt", "pie", "gitgraph",
  "mindmap", "timeline", "journey", "quadrantchart",
  "requirementdiagram", "c4context", "c4container", "c4component",
  "c4dynamic", "c4deployment", "sankey", "xychart", "block",
  "packet", "kanban", "architecture",
];

/**
 * Lightweight server-side Mermaid syntax validation.
 *
 * Does NOT use mermaid.parse() since that requires browser DOM APIs.
 * Checks for recognisable diagram keywords and basic structural issues.
 * Full syntax validation happens client-side during rendering.
 */
function validateMermaidSyntax(markup: string): string | null {
  const trimmed = markup.trim();
  if (!trimmed) {
    return "Empty diagram markup";
  }

  const firstLine = trimmed.split("\n")[0].trim().toLowerCase();
  const recognised = KNOWN_DIAGRAM_KEYWORDS.some((kw) =>
    firstLine.startsWith(kw),
  );
  if (!recognised) {
    return (
      `Unrecognised diagram type. First line must start with a diagram keyword ` +
      `(e.g. flowchart, sequenceDiagram, classDiagram, erDiagram, gantt, …). ` +
      `Got: "${trimmed.split("\n")[0].trim()}"`
    );
  }

  return null; // looks valid — full validation at render time
}

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Mermaid Diagram Server",
    version: "1.0.0",
  });

  // --- Main tool: renderMermaidDiagram ---
  registerAppTool(
    server,
    "renderMermaidDiagram",
    {
      title: "Render Mermaid Diagram",
      description:
        "Renders a Mermaid diagram with syntax validation, theme-aware styling, " +
        "zoom/pan, drag-select, and fullscreen support. Uses beautiful-mermaid for " +
        "flowcharts, state, sequence, class, and ER diagrams; falls back to " +
        "standard mermaid.js for all other types.",
      inputSchema: {
        markup: z
          .string()
          .describe("Mermaid diagram markup (e.g., 'flowchart TD\\n  A-->B')"),
        title: z
          .string()
          .optional()
          .describe("Optional short title for the diagram"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async (args: {
      markup: string;
      title?: string;
    }): Promise<CallToolResult> => {
      const { markup, title } = args;

      const diagramType = detectDiagramType(markup);
      const useBeautiful = BEAUTIFUL_MERMAID_TYPES.has(diagramType);

      // Lightweight server-side validation (full check happens in the UI)
      const syntaxError = validateMermaidSyntax(markup);

      if (syntaxError) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Mermaid syntax error: ${syntaxError}\n\nPlease fix the markup and try again.\n\nMarkup:\n${markup}`,
            },
          ],
          structuredContent: {
            markup,
            title: title ?? "",
            syntaxError,
            diagramType,
            renderer: "none",
          },
        };
      }

      return {
        content: [
          {
            type: "text",
            text: title
              ? `Rendered "${title}" (${diagramType} diagram, ${useBeautiful ? "beautiful-mermaid" : "mermaid.js"})`
              : `Rendered ${diagramType} diagram (${useBeautiful ? "beautiful-mermaid" : "mermaid.js"})`,
          },
        ],
        structuredContent: {
          markup,
          title: title ?? "",
          syntaxError: null,
          diagramType,
          renderer: useBeautiful ? "beautiful-mermaid" : "mermaid",
        },
      };
    },
  );

  // --- App-only tool: validate Mermaid syntax from the UI ---
  registerAppTool(
    server,
    "validateMermaidSyntax",
    {
      title: "Validate Mermaid Syntax",
      description: "Validates Mermaid markup syntax without rendering.",
      inputSchema: {
        markup: z.string().describe("Mermaid markup to validate"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
      _meta: {
        ui: {
          resourceUri: RESOURCE_URI,
          visibility: ["app"],
        },
      },
    },
    async (args: { markup: string }): Promise<CallToolResult> => {
      const syntaxError = validateMermaidSyntax(args.markup);
      const diagramType = detectDiagramType(args.markup);
      const useBeautiful = BEAUTIFUL_MERMAID_TYPES.has(diagramType);

      return {
        content: [
          {
            type: "text",
            text: syntaxError
              ? `Invalid: ${syntaxError}`
              : `Valid ${diagramType} diagram`,
          },
        ],
        structuredContent: {
          valid: syntaxError === null,
          error: syntaxError,
          diagramType,
          renderer: useBeautiful ? "beautiful-mermaid" : "mermaid",
        },
      };
    },
  );

  // --- Resource: serve the bundled UI HTML ---
  registerAppResource(
    server,
    RESOURCE_URI,
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(
        path.join(DIST_DIR, "mcp-app.html"),
        "utf-8",
      );
      return {
        contents: [
          { uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );

  return server;
}
