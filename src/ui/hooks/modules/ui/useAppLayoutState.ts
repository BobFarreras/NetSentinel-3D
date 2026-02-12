import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export type ResizeMode = null | "sidebar" | "console" | "radar" | "dock_split";

export const useAppLayoutState = () => {
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const [radarWidth, setRadarWidth] = useState(520);
  const [dockSplitRatio, setDockSplitRatio] = useState(0.5);
  const [isResizing, setIsResizing] = useState(false);

  const resizeMode = useRef<ResizeMode>(null);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startSidebarWidth = useRef(450);
  const startConsoleHeight = useRef(250);
  const startRadarWidth = useRef(520);
  const startDockSplitRatio = useRef(0.5);

  const startResizingSidebar = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "sidebar";
    dragStartX.current = e.clientX;
    startSidebarWidth.current = sidebarWidth;
    setIsResizing(true);
  }, [sidebarWidth]);

  const startResizingConsole = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "console";
    dragStartY.current = e.clientY;
    startConsoleHeight.current = consoleHeight;
    setIsResizing(true);
  }, [consoleHeight]);

  const startResizingRadar = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "radar";
    dragStartX.current = e.clientX;
    startRadarWidth.current = radarWidth;
    setIsResizing(true);
  }, [radarWidth]);

  const startResizingDockSplit = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "dock_split";
    dragStartX.current = e.clientX;
    startDockSplitRatio.current = dockSplitRatio;
    setIsResizing(true);
  }, [dockSplitRatio]);

  const stopResizing = useCallback(() => {
    resizeMode.current = null;
    document.body.style.cursor = "default";
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (resizeMode.current === "sidebar") {
      const delta = dragStartX.current - e.clientX;
      const next = Math.max(300, Math.min(800, startSidebarWidth.current + delta));
      setSidebarWidth(next);
      document.body.style.cursor = "col-resize";
      return;
    }

    if (resizeMode.current === "console") {
      const delta = dragStartY.current - e.clientY;
      const next = Math.max(120, Math.min(window.innerHeight - 160, startConsoleHeight.current + delta));
      setConsoleHeight(next);
      document.body.style.cursor = "row-resize";
      return;
    }

    if (resizeMode.current === "radar") {
      const delta = e.clientX - dragStartX.current;
      const next = Math.max(360, Math.min(820, startRadarWidth.current + delta));
      setRadarWidth(next);
      document.body.style.cursor = "col-resize";
      return;
    }

    if (resizeMode.current === "dock_split") {
      const delta = e.clientX - dragStartX.current;
      const laneWidth = Math.max(360, radarWidth);
      const next = startDockSplitRatio.current + delta / laneWidth;
      setDockSplitRatio(Math.max(0.28, Math.min(0.72, next)));
      document.body.style.cursor = "col-resize";
    }
  }, [radarWidth]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return {
    sidebarWidth,
    consoleHeight,
    radarWidth,
    dockSplitRatio,
    isResizing,
    startResizingSidebar,
    startResizingConsole,
    startResizingRadar,
    startResizingDockSplit,
  };
};
