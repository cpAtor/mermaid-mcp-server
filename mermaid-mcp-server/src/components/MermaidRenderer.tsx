/**
 * MermaidRenderer Component
 *
 * Renders Mermaid diagrams using either beautiful-mermaid (for supported
 * diagram types) or standard mermaid.js (as fallback). Applies host
 * theme colors for consistent look.
 */
import { useRef, useEffect, useState, useId } from "react";
import type { DocumentTheme } from "../theme.ts";
import {
  getBeautifulMermaidTheme,
  getEnrichmentColors,
  getMermaidTheme,
} from "../theme.ts";
import type { SelectedElement } from "../types.ts";

interface MermaidRendererProps {
  markup: string;
  diagramType: string;
  renderer: "beautiful-mermaid" | "mermaid" | "none";
  theme: DocumentTheme;
  selectedElements: SelectedElement[];
}

export function MermaidRenderer({
  markup,
  diagramType,
  renderer,
  theme,
  selectedElements,
}: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const uniqueId = useId().replace(/:/g, "-");

  useEffect(() => {
    if (!containerRef.current || renderer === "none") return;

    let cancelled = false;

    async function render() {
      const container = containerRef.current;
      if (!container) return;

      try {
        setError(null);

        if (renderer === "beautiful-mermaid") {
          // Dynamic import to keep it out of server bundle
          const { renderMermaid } = await import("beautiful-mermaid");
          const bmTheme = getBeautifulMermaidTheme(theme);
          const colors = getEnrichmentColors(theme);

          const svg = await renderMermaid(markup, {
            ...bmTheme,
            ...colors,
          });

          if (!cancelled) {
            container.innerHTML = svg;
          }
        } else {
          // Standard mermaid.js renderer
          const mermaid = (await import("mermaid")).default;
          mermaid.initialize({
            startOnLoad: false,
            theme: getMermaidTheme(theme),
            securityLevel: "loose",
            fontFamily: "var(--font-sans)",
          });

          const elementId = `mermaid-${uniqueId}`;
          const { svg } = await mermaid.render(elementId, markup);

          if (!cancelled) {
            container.innerHTML = svg;
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : String(err),
          );
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [markup, diagramType, renderer, theme, uniqueId]);

  // Apply selection highlights
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous selections
    containerRef.current
      .querySelectorAll(".mermaid-selected")
      .forEach((el) => el.classList.remove("mermaid-selected"));

    // Highlight selected elements
    for (const sel of selectedElements) {
      const el = containerRef.current.querySelector(`#${CSS.escape(sel.id)}`);
      if (el) {
        el.classList.add("mermaid-selected");
      }
    }
  }, [selectedElements]);

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          color: "var(--color-text-danger)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-text-sm-size, 13px)",
          whiteSpace: "pre-wrap",
        }}
      >
        Render error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "100%",
        minHeight: "100%",
        padding: 24,
      }}
    />
  );
}
