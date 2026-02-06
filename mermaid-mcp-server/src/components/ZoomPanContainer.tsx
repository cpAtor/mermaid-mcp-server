/**
 * ZoomPanContainer Component
 *
 * Wraps children in a zoomable and pannable container using
 * react-zoom-pan-pinch. Scroll-to-zoom is disabled; zoom is
 * controlled via dedicated buttons exposed through a ref.
 */
import {
  type ReactNode,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";

/** Methods exposed to parent via ref */
export interface ZoomPanHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

interface ZoomPanContainerProps {
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Inner component that has access to useControls() context.
 */
const ZoomPanInner = forwardRef<ZoomPanHandle, { children: ReactNode }>(
  function ZoomPanInner({ children }, ref) {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    useImperativeHandle(ref, () => ({
      zoomIn: () => zoomIn(0.3),
      zoomOut: () => zoomOut(0.3),
      resetZoom: () => resetTransform(),
    }), [zoomIn, zoomOut, resetTransform]);

    return (
      <TransformComponent
        wrapperStyle={{
          width: "100%",
          height: "100%",
        }}
        contentStyle={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          minWidth: "100%",
          minHeight: "100%",
          paddingTop: 8,
        }}
      >
        {children}
      </TransformComponent>
    );
  },
);

export const ZoomPanContainer = forwardRef<ZoomPanHandle, ZoomPanContainerProps>(
  function ZoomPanContainer({ children, disabled = false }, ref) {
    return (
      <TransformWrapper
        disabled={disabled}
        initialScale={1}
        minScale={0.1}
        maxScale={5}
        centerOnInit
        wheel={{ disabled: true }}
        panning={{ velocityDisabled: true }}
      >
        <ZoomPanInner ref={ref}>{children}</ZoomPanInner>
      </TransformWrapper>
    );
  },
);
