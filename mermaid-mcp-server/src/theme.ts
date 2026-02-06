/**
 * Theme mapping for beautiful-mermaid.
 *
 * Maps the host document theme (light/dark) to a beautiful-mermaid theme
 * and provides color overrides derived from MCP Apps standardized CSS variables.
 */
import { THEMES } from "beautiful-mermaid";

export type DocumentTheme = "light" | "dark";

/** Get the beautiful-mermaid theme name for the given document theme */
export function getBeautifulMermaidTheme(
  docTheme: DocumentTheme,
) {
  return docTheme === "dark" ? THEMES["github-dark"] : THEMES["github-light"];
}

/**
 * Build beautiful-mermaid enrichment colors from MCP Apps CSS variables.
 * Uses the standardized `--color-*` / `--font-*` names from the spec.
 * Falls back to sensible defaults if variables aren't available.
 */
export function getEnrichmentColors(docTheme: DocumentTheme): {
  bg: string;
  fg: string;
  line?: string;
  accent?: string;
  muted?: string;
  surface?: string;
  border?: string;
} {
  const style = getComputedStyle(document.documentElement);

  const getVar = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim();
    return value || fallback;
  };

  if (docTheme === "dark") {
    return {
      bg: getVar("--color-background-primary", "#0d1117"),
      fg: getVar("--color-text-primary", "#e6edf3"),
      line: getVar("--color-border-primary", "#30363d"),
      accent: getVar("--color-ring-primary", "#58a6ff"),
      muted: getVar("--color-text-secondary", "#8b949e"),
      surface: getVar("--color-background-secondary", "#161b22"),
      border: getVar("--color-border-primary", "#30363d"),
    };
  }

  return {
    bg: getVar("--color-background-primary", "#ffffff"),
    fg: getVar("--color-text-primary", "#1f2328"),
    line: getVar("--color-border-primary", "#d0d7de"),
    accent: getVar("--color-ring-primary", "#0969da"),
    muted: getVar("--color-text-secondary", "#656d76"),
    surface: getVar("--color-background-secondary", "#f6f8fa"),
    border: getVar("--color-border-primary", "#d0d7de"),
  };
}

/**
 * Get the standard mermaid.js theme name for document theme.
 */
export function getMermaidTheme(docTheme: DocumentTheme): "dark" | "default" {
  return docTheme === "dark" ? "dark" : "default";
}
