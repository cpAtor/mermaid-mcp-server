/**
 * Root React component for the Mermaid MCP App.
 *
 * Connects to the MCP host, receives diagram data via tool results,
 * and orchestrates rendering, zoom/pan, drag-select, and fullscreen.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  useApp,
  useDocumentTheme,
} from "@modelcontextprotocol/ext-apps/react";
import {
  applyDocumentTheme,
  applyHostStyleVariables,
  applyHostFonts,
} from "@modelcontextprotocol/ext-apps";
import type { App as McpApp, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { MermaidToolResult, SelectedElement } from "./types.ts";
import { MermaidRenderer } from "./components/MermaidRenderer.tsx";
import { Toolbar } from "./components/Toolbar.tsx";
import { ErrorOverlay } from "./components/ErrorOverlay.tsx";
import { ZoomPanContainer, type ZoomPanHandle } from "./components/ZoomPanContainer.tsx";
import { DragSelector } from "./components/DragSelector.tsx";
import { CodePanel } from "./components/CodePanel.tsx";

export function App() {
  const [diagramData, setDiagramData] = useState<MermaidToolResult | null>(
    null,
  );
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>(
    [],
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragSelectEnabled, setDragSelectEnabled] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState<{
    top: number;
    right: number;
    bottom: number;
    left: number;
  } | null>(null);
  const zoomRef = useRef<ZoomPanHandle>(null);

  const handleToolResult = useCallback((result: CallToolResult) => {
    const data = result.structuredContent as MermaidToolResult | undefined;
    if (data && typeof data.markup === "string") {
      setDiagramData(data);
      setSelectedElements([]);
    }
  }, []);

  // Track host context in state for unified handling
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const onAppCreated = useCallback((app: McpApp) => {
    app.ontoolresult = handleToolResult;
    // Merge partial host context updates into state
    app.onhostcontextchanged = (ctx) => {
      setHostContext((prev) => ({ ...prev, ...ctx }));
    };
  }, [handleToolResult]);

  const { app, error: appError } = useApp({
    appInfo: { name: "mermaid-diagram", version: "1.0.0" },
    capabilities: {
      availableDisplayModes: ["inline", "fullscreen"],
    },
    onAppCreated,
  });

  // Set initial host context after connection
  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  // Apply theme, style variables, and fonts whenever host context changes
  useEffect(() => {
    if (hostContext?.theme) {
      applyDocumentTheme(hostContext.theme);
    }
    if (hostContext?.styles?.variables) {
      applyHostStyleVariables(hostContext.styles.variables);
    }
    if (hostContext?.styles?.css?.fonts) {
      applyHostFonts(hostContext.styles.css.fonts);
    }
  }, [hostContext]);

  // Sync display mode and safe area from host context
  useEffect(() => {
    if (hostContext?.displayMode) {
      setIsFullscreen(hostContext.displayMode === "fullscreen");
    }
    if (hostContext?.safeAreaInsets) {
      setSafeAreaInsets(hostContext.safeAreaInsets);
    }
  }, [hostContext]);

  // Reactive theme for beautiful-mermaid / mermaid.js rendering
  const documentTheme = useDocumentTheme();
  const theme = documentTheme ?? "light";

  // Toggle fullscreen display mode
  const toggleFullscreen = useCallback(async () => {
    if (!app) return;
    const newMode = isFullscreen ? "inline" : "fullscreen";
    const ctx = app.getHostContext();
    console.log("Host context:", JSON.stringify(ctx, null, 2));
    console.log("Available display modes:", ctx?.availableDisplayModes);
    console.log("Current display mode:", ctx?.displayMode);
    try {
      const result = await app.requestDisplayMode({ mode: newMode });
      console.log("requestDisplayMode result:", JSON.stringify(result));
      setIsFullscreen(!isFullscreen);
    } catch (err) {
      console.warn("Display mode change failed:", err);
    }
  }, [app, isFullscreen]);

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
      <div style={{ padding: 16, color: "var(--color-text-danger)" }}>
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
      className={`app-container${isFullscreen ? " fullscreen" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        position: "relative",
        paddingTop: safeAreaInsets?.top,
        paddingRight: safeAreaInsets?.right,
        paddingBottom: safeAreaInsets?.bottom,
        paddingLeft: safeAreaInsets?.left,
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
        showCode={showCode}
        onToggleCode={() => setShowCode((v) => !v)}
      />

      {/* Code panel */}
      {showCode && diagramData.markup && (
        <CodePanel markup={diagramData.markup} />
      )}

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
