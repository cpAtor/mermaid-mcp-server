/**
 * ErrorOverlay Component
 *
 * Displays syntax or rendering errors in a styled overlay panel.
 */

interface ErrorOverlayProps {
  error: string;
}

export function ErrorOverlay({ error }: ErrorOverlayProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-text-danger)",
        }}
      >
        ⚠ Syntax Error
      </div>
      <div
        style={{
          maxWidth: 600,
          width: "100%",
          padding: 16,
          borderRadius: 8,
          border:
            "1px solid var(--color-border-danger)",
          background:
            "var(--color-background-danger)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-text-sm-size, 13px)",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          color: "var(--color-text-danger)",
        }}
      >
        {error}
      </div>
      <div
        style={{
          fontSize: 12,
          opacity: 0.6,
          maxWidth: 400,
          textAlign: "center",
        }}
      >
        The model has been notified of this error and should
        provide corrected markup.
      </div>
    </div>
  );
}
