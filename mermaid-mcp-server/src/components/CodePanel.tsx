/**
 * CodePanel Component
 *
 * Displays the raw Mermaid markup in a styled, scrollable code block
 * with a copy-to-clipboard button.
 */
import { useState, useCallback } from "react";

interface CodePanelProps {
  markup: string;
}

export function CodePanel({ markup }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markup);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API isn't available
      const textarea = document.createElement("textarea");
      textarea.value = markup;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [markup]);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border-primary)",
        background: "var(--color-background-primary)",
        maxHeight: 220,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header with copy button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 12px",
          borderBottom: "1px solid var(--color-border-primary)",
          background: "var(--color-background-secondary)",
          fontSize: "var(--font-text-sm-size, 11px)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-text-secondary)",
        }}
      >
        <span>Mermaid</span>
        <button
          onClick={handleCopy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            border: "1px solid var(--color-border-primary)",
            borderRadius: "var(--border-radius-sm, 4px)",
            background: copied
              ? "var(--color-background-success)"
              : "var(--color-background-secondary)",
            color: copied
              ? "var(--color-text-success)"
              : "var(--color-text-primary)",
            fontSize: "var(--font-text-sm-size, 11px)",
            cursor: "pointer",
            lineHeight: 1.4,
            transition: "background 0.15s, color 0.15s",
          }}
          title="Copy to clipboard"
        >
          {copied ? "✓ Copied" : "⧉ Copy"}
        </button>
      </div>

      {/* Code content */}
      <pre
        style={{
          margin: 0,
          padding: "8px 12px",
          overflow: "auto",
          flex: 1,
          fontSize: "var(--font-text-sm-size, 12px)",
          lineHeight: 1.5,
          fontFamily: "var(--font-mono)",
          color: "var(--color-text-primary)",
          whiteSpace: "pre",
          tabSize: 2,
        }}
      >
        <code>{markup}</code>
      </pre>
    </div>
  );
}
