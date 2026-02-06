/**
 * Shared types for Mermaid MCP App.
 */

/** Structured content returned by the renderMermaidDiagram tool */
export interface MermaidToolResult {
  markup: string;
  title: string;
  syntaxError: string | null;
  diagramType: string;
  renderer: "beautiful-mermaid" | "mermaid" | "none";
}

/** Structured content returned by the validateMermaidSyntax tool */
export interface ValidationResult {
  valid: boolean;
  error: string | null;
  diagramType: string;
  renderer: "beautiful-mermaid" | "mermaid";
}

/** Diagram element selected via drag selection */
export interface SelectedElement {
  id: string;
  label: string;
  type: "node" | "edge" | "label" | "unknown";
}
