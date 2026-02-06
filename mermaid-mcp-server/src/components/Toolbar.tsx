/**
 * Toolbar Component
 *
 * Displays diagram metadata and action buttons: fullscreen toggle,
 * drag-select toggle, selection management, and adding elements to
 * chat context.
 */

interface ToolbarProps {
  title: string;
  diagramType: string;
  renderer: "beautiful-mermaid" | "mermaid" | "none";
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  dragSelectEnabled: boolean;
  onToggleDragSelect: () => void;
  selectedCount: number;
  onAddToContext: () => void;
  onClearSelection: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  showCode: boolean;
  onToggleCode: () => void;
}

const buttonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  border: "1px solid var(--color-border-default, #d0d7de)",
  borderRadius: 6,
  background: "var(--color-background-secondary, #f6f8fa)",
  color: "var(--color-text-primary, inherit)",
  fontSize: 12,
  cursor: "pointer",
  lineHeight: 1.4,
  whiteSpace: "nowrap",
};

const activeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "var(--color-accent-fg, #0969da)",
  color: "#fff",
  borderColor: "var(--color-accent-fg, #0969da)",
};

export function Toolbar({
  title,
  diagramType,
  renderer,
  isFullscreen,
  onToggleFullscreen,
  dragSelectEnabled,
  onToggleDragSelect,
  selectedCount,
  onAddToContext,
  onClearSelection,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  showCode,
  onToggleCode,
}: ToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        borderBottom: "1px solid var(--color-border-default, #d0d7de)",
        background: "var(--color-background-secondary, #f6f8fa)",
        fontSize: 12,
        flexShrink: 0,
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {/* Left: diagram info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
        }}
      >
        {title && (
          <span
            style={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 200,
            }}
          >
            {title}
          </span>
        )}
        <span
          style={{
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--color-neutral-muted, #e0e0e0)",
            fontSize: 11,
            opacity: 0.8,
          }}
        >
          {diagramType}
        </span>
        <span
          style={{
            fontSize: 11,
            opacity: 0.6,
          }}
        >
          {renderer === "beautiful-mermaid" ? "✨ beautiful" : "mermaid.js"}
        </span>
      </div>

      {/* Right: actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* Zoom controls */}
        <button onClick={onZoomOut} style={buttonStyle} title="Zoom out">
          −
        </button>
        <button onClick={onZoomReset} style={buttonStyle} title="Reset zoom">
          ⟳
        </button>
        <button onClick={onZoomIn} style={buttonStyle} title="Zoom in">
          +
        </button>

        {/* Separator */}
        <span style={{ borderLeft: "1px solid var(--color-border-default, #d0d7de)", height: 18 }} />

        {/* Code view toggle */}
        <button
          onClick={onToggleCode}
          style={showCode ? activeButtonStyle : buttonStyle}
          title={showCode ? "Hide code" : "Show Mermaid code"}
        >
          {"</> Code"}
        </button>

        {/* Separator */}
        <span style={{ borderLeft: "1px solid var(--color-border-default, #d0d7de)", height: 18 }} />

        {/* Drag select toggle */}
        <button
          onClick={onToggleDragSelect}
          style={dragSelectEnabled ? activeButtonStyle : buttonStyle}
          title={
            dragSelectEnabled
              ? "Disable drag selection (re-enable zoom/pan)"
              : "Enable drag selection"
          }
        >
          ⬚ Select
        </button>

        {/* Selection actions */}
        {selectedCount > 0 && (
          <>
            <span style={{ fontSize: 11 }}>
              {selectedCount} selected
            </span>
            <button
              onClick={onAddToContext}
              style={buttonStyle}
              title="Add selected elements to chat context"
            >
              💬 Add to Chat
            </button>
            <button
              onClick={onClearSelection}
              style={buttonStyle}
              title="Clear selection"
            >
              ✕
            </button>
          </>
        )}

        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          style={buttonStyle}
          title={isFullscreen ? "Exit fullscreen" : "Open in fullscreen"}
        >
          {isFullscreen ? "⊡ Exit" : "⊞ Expand"}
        </button>
      </div>
    </div>
  );
}
