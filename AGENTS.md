# Mermaid MCP Server

An MCP server that gives agents the ability to render Mermaid diagrams using the MCP apps functionality.

## Overview

This repo implements an MCP (Model Context Protocol) server that exposes a `renderMermaidDiagram` tool. Agents send Mermaid.js markup to the tool and receive a rendered diagram back via MCP apps, delivering visual output (HTML/SVG) directly to the client rather than raw text.

## Key Concepts

- **MCP apps** — Used to return rendered visual output instead of plain text responses.
- **`renderMermaidDiagram` tool** — The primary tool exposed by this server:
  - `markup` (required) — Mermaid.js diagram definition.
  - `title` (optional) — A short descriptive title for the diagram.
- Supports all standard Mermaid diagram types: flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, Gantt charts, pie charts, git graphs, mindmaps, timelines, etc.

## Architecture & Conventions

- **Language:** TypeScript (preferred per MCP best practices).
- **Scaffolding over manual file creation:** Prefer CLI scaffolding commands (e.g., `npm init`, `npx create-*`, `dotnet new`, framework CLIs) over manually creating files whenever a reliable scaffolding tool exists. This ensures correct project structure, up-to-date boilerplate, and proper configuration from the start. Only create files manually when no suitable scaffolding command is available or when adding individual files to an already-scaffolded project.
- **Use external libraries:** Leverage well-maintained, widely-adopted external packages for common problems (e.g., parsing, validation, HTTP handling, logging, testing) instead of writing custom implementations. Check npm / package registries before building from scratch. Prefer libraries with active maintenance, good documentation, and strong community adoption.
- **MCP skill:** The `mcp-builder` skill (`.agents/skills/mcp-builder/`) contains detailed guidance on MCP server design — consult it before making architectural decisions about server structure, tool design, or transport.
- **Tool annotations:** `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`.
- **Error handling:** Validate Mermaid markup before rendering; return actionable error messages when markup is invalid or rendering fails.
- **Tool descriptions:** Keep concise and action-oriented so LLMs can discover and use the tool effectively.

## Context7 MCP Server

This workspace also has the **Context7** MCP server installed, which provides agents with access to up-to-date library documentation and code examples.

### Tools

- **`resolve-library-id`** — Resolves a package/product name to a Context7-compatible library ID. Must be called before `get-library-docs` to obtain a valid library ID (unless the user provides one directly in `/org/project` format).
- **`get-library-docs`** — Fetches documentation and code snippets for a given library using its Context7-compatible library ID. Supports optional `topic` filtering and `tokens` limit.

### Usage Guidelines

- Always call `resolve-library-id` first to get the correct library ID before fetching docs.
- Use Context7 to retrieve current documentation when working with external libraries — this ensures code generation uses up-to-date APIs rather than potentially outdated training data.
- Useful for verifying correct usage of Mermaid.js APIs, Node/TypeScript libraries, or any dependency used in this project.
