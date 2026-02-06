/**
 * DragSelector Component
 *
 * Provides a drag-to-select overlay on the diagram area. When the user drags a
 * rectangle, it finds SVG elements within the selection bounds and extracts
 * their IDs and labels for adding to chat context.
 */
import { useState, useCallback, useRef, useEffect } from "react";
import type { SelectedElement } from "../types.ts";

interface DragSelectorProps {
  onSelectionChange: (elements: SelectedElement[]) => void;
}

interface DragRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Extract a readable label from an SVG element.
 */
function extractLabel(el: Element): string {
  // Try text content within the element
  const textEl = el.querySelector("text, .nodeLabel, .edgeLabel, foreignObject span");
  if (textEl?.textContent?.trim()) {
    return textEl.textContent.trim();
  }
  // Fall back to the element's aria-label or title
  return (
    el.getAttribute("aria-label") ??
    el.querySelector("title")?.textContent?.trim() ??
    el.id ??
    "unlabeled"
  );
}

/**
 * Classify an SVG element type.
 */
function classifyElement(el: Element): SelectedElement["type"] {
  const classes = el.className?.toString?.() ?? "";
  if (/\bnode\b/i.test(classes)) return "node";
  if (/\bedge\b|\bedgePath\b/i.test(classes)) return "edge";
  if (/\blabel\b|\bedgeLabel\b/i.test(classes)) return "label";
  // Check parent for mermaid class patterns
  const tagName = el.tagName.toLowerCase();
  if (tagName === "g") {
    if (el.id?.startsWith("flowchart-") || el.id?.startsWith("state")) return "node";
    if (el.id?.includes("edge")) return "edge";
  }
  return "unknown";
}

export function DragSelector({ onSelectionChange }: DragSelectorProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag on left-click
    if (e.button !== 0) return;
    isDragging.current = true;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    setDragRect({ startX, startY, currentX: startX, currentY: startY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !dragRect) return;
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragRect((prev) =>
      prev
        ? {
            ...prev,
            currentX: e.clientX - rect.left,
            currentY: e.clientY - rect.top,
          }
        : null,
    );
  }, [dragRect]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !dragRect || !overlayRef.current) {
      isDragging.current = false;
      setDragRect(null);
      return;
    }

    isDragging.current = false;

    // Calculate selection bounds (in overlay coordinates)
    const x1 = Math.min(dragRect.startX, dragRect.currentX);
    const y1 = Math.min(dragRect.startY, dragRect.currentY);
    const x2 = Math.max(dragRect.startX, dragRect.currentX);
    const y2 = Math.max(dragRect.startY, dragRect.currentY);

    // Minimum drag distance to count as selection
    if (Math.abs(x2 - x1) < 5 && Math.abs(y2 - y1) < 5) {
      setDragRect(null);
      return;
    }

    // Find SVG elements within the selection rectangle
    const overlayRect = overlayRef.current.getBoundingClientRect();
    const selectionBounds = {
      left: overlayRect.left + x1,
      top: overlayRect.top + y1,
      right: overlayRect.left + x2,
      bottom: overlayRect.top + y2,
    };

    // Query all mermaid node/edge groups in the sibling container
    const container = overlayRef.current.parentElement;
    if (!container) {
      setDragRect(null);
      return;
    }

    const svgElements = container.querySelectorAll(
      "svg g.node, svg g.edgePath, svg g.edgeLabel, svg g.cluster, " +
      "svg g[id^='flowchart-'], svg g[id^='state'], svg g[id^='classId-'], " +
      "svg g[id^='entity-']",
    );

    const selected: SelectedElement[] = [];
    const seenIds = new Set<string>();

    svgElements.forEach((el) => {
      const elRect = el.getBoundingClientRect();
      // Check if element intersects selection rectangle
      const overlaps =
        elRect.left < selectionBounds.right &&
        elRect.right > selectionBounds.left &&
        elRect.top < selectionBounds.bottom &&
        elRect.bottom > selectionBounds.top;

      if (overlaps && el.id && !seenIds.has(el.id)) {
        seenIds.add(el.id);
        selected.push({
          id: el.id,
          label: extractLabel(el),
          type: classifyElement(el),
        });
      }
    });

    onSelectionChange(selected);
    setDragRect(null);
  }, [dragRect, onSelectionChange]);

  // Clean up drag on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        isDragging.current = false;
        setDragRect(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Compute visual rect
  const visualRect = dragRect
    ? {
        left: Math.min(dragRect.startX, dragRect.currentX),
        top: Math.min(dragRect.startY, dragRect.currentY),
        width: Math.abs(dragRect.currentX - dragRect.startX),
        height: Math.abs(dragRect.currentY - dragRect.startY),
      }
    : null;

  return (
    <div
      ref={overlayRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "crosshair",
        zIndex: 50,
      }}
    >
      {visualRect && (
        <div
          className="drag-selection-rect"
          style={{
            left: visualRect.left,
            top: visualRect.top,
            width: visualRect.width,
            height: visualRect.height,
          }}
        />
      )}
    </div>
  );
}
