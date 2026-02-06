/**
 * Root React component for the Mermaid MCP App.
 *
 * Connects to the MCP host, receives diagram data via tool results,
 * and orchestrates rendering, zoom/pan, drag-select, and fullscreen.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  useApp,
  useHostStyles,
  useDocumentTheme,
} from "@modelcontextprotocol/ext-apps/react";
import type { App as McpApp } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { MermaidToolResult, SelectedElement } from "./types.ts";
import { MermaidRenderer } from "./components/MermaidRenderer.tsx";
import { Toolbar } from "./components/Toolbar.tsx";
import { ErrorOverlay } from "./components/ErrorOverlay.tsx";
import { ZoomPanContainer, type ZoomPanHandle } from "./components/ZoomPanContainer.tsx";
import { DragSelector } from "./components/DragSelector.tsx";

export function App() {
  const [diagramData, setDiagramData] = useState<MermaidToolResult | null>(
    null,
  );
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>(
    [],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragSelectEnabled, setDragSelectEnabled] = useState(false);
  const zoomRef = useRef<ZoomPanHandle>(null);

  const handleToolResult = useCallback((result: CallToolResult) => {
    const data = result.structuredContent as MermaidToolResult | undefined;
    if (data && typeof data.markup === "string") {
      setDiagramData(data);
      setSelectedElements([]);
    }
  }, []);

  const onAppCreated = useCallback((app: McpApp) => {
    app.ontoolresult = handleToolResult;
  }, [handleToolResult]);

  const { app, error: appError } = useApp({
    appInfo: { name: "mermaid-diagram", version: "1.0.0" },
    capabilities: {},
    onAppCreated,
  });

  // Apply host CSS variables for theme-awareness
  useHostStyles(app);
  const documentTheme = useDocumentTheme();
  const theme = documentTheme ?? "light";

  // Toggle fullscreen display mode
  const toggleFullscreen = useCallback(async () => {
    if (!app) return;
    const newMode = isFullscreen ? "inline" : "fullscreen";
    try {
      await app.requestDisplayMode({ mode: newMode });
      setIsFullscreen(!isFullscreen);
    } catch {
      // Host may not support display mode changes
      console.warn("Display mode change not supported");
    }
  }, [app, isFullscreen]);

  // Listen for host context changes (e.g., display mode updates)
  useEffect(() => {
    if (!app) return;
    const prev = app.onhostcontextchanged;
    app.onhostcontextchanged = (ctx) => {
      if (ctx.displayMode) {
        setIsFullscreen(ctx.displayMode === "fullscreen");
      }
      prev?.(ctx);
    };
    return () => {
      app.onhostcontextchanged = prev ?? null;
    };
  }, [app]);

  // Push selected elements to chat context
  const addSelectionToContext = useCallback(async () => {
    if (!app || selectedElements.length === 0) return;

    const summary = selectedElements
      .map((el) => `${el.type}: ${el.label} (${el.id})`)
      .join("\n");

    await app.updateModelContext({
      content: [
        {
          type: "text",
          text: `Selected diagram elements:\n${summary}`,
        },
      ],
    });
  }, [app, selectedElements]);

  if (appError) {
    return (
      <div style={{ padding: 16, color: "red" }}>
        Failed to connect to host: {String(appError)}
      </div>
    );
  }

  if (!diagramData) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          opacity: 0.5,
          fontSize: 14,
        }}
      >
        Waiting for diagram…
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Toolbar */}
      <Toolbar
        title={diagramData.title}
        diagramType={diagramData.diagramType}
        renderer={diagramData.renderer}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        dragSelectEnabled={dragSelectEnabled}
        onToggleDragSelect={() => setDragSelectEnabled((v) => !v)}
        selectedCount={selectedElements.length}
        onAddToContext={addSelectionToContext}
        onClearSelection={() => setSelectedElements([])}
        onZoomIn={() => zoomRef.current?.zoomIn()}
        onZoomOut={() => zoomRef.current?.zoomOut()}
        onZoomReset={() => zoomRef.current?.resetZoom()}
      />

      {/* Error overlay for syntax errors */}
      {diagramData.syntaxError && (
        <ErrorOverlay error={diagramData.syntaxError} />
      )}

      {/* Diagram area with zoom/pan and drag-select */}
      {!diagramData.syntaxError && (
        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <ZoomPanContainer ref={zoomRef} disabled={dragSelectEnabled}>
            <MermaidRenderer
              markup={diagramData.markup}
              diagramType={diagramData.diagramType}
              renderer={diagramData.renderer}
              theme={theme}
              selectedElements={selectedElements}
            />
          </ZoomPanContainer>

          {dragSelectEnabled && (
            <DragSelector
              onSelectionChange={setSelectedElements}
            />
          )}
        </div>
      )}
    </div>
  );
}
