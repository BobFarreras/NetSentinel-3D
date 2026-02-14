// src/ui/hooks/modules/ui/useAppLayoutState.ts
// Hook de layout: controla medidas (sidebar/radar/console) y gestiona drag-resize con listeners globales.

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export type ResizeMode =
  | null
  | "sidebar"
  | "console"
  | "radar"
  | "dock_split"
  | "dock_settings_split"
  | "dock_triple_left"
  | "dock_triple_right";

export const useAppLayoutState = () => {
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const [radarWidth, setRadarWidth] = useState(520);
  const [dockSplitRatio, setDockSplitRatio] = useState(0.5);
  // Split en 3 columnas (Radar | Attack | Settings) dentro del dock area.
  // Ratios representan la posicion de los separadores sobre el ancho total del dock area.
  const [dockTripleLeftRatio, setDockTripleLeftRatio] = useState(0.34);
  const [dockTripleRightRatio, setDockTripleRightRatio] = useState(0.68);
  // Split en 2 columnas cuando Settings comparte dock con Radar o Attack (pero no ambos).
  const [dockSettingsSplitRatio, setDockSettingsSplitRatio] = useState(0.62);
  const [isResizing, setIsResizing] = useState(false);

  const resizeMode = useRef<ResizeMode>(null);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const startSidebarWidth = useRef(450);
  const startConsoleHeight = useRef(250);
  const startRadarWidth = useRef(520);
  const startDockSplitRatio = useRef(0.5);
  const startDockTripleLeftRatio = useRef(0.34);
  const startDockTripleRightRatio = useRef(0.68);
  const startDockSettingsSplitRatio = useRef(0.62);

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

  const startResizingDockSettingsSplit = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "dock_settings_split";
    dragStartX.current = e.clientX;
    startDockSettingsSplitRatio.current = dockSettingsSplitRatio;
    setIsResizing(true);
  }, [dockSettingsSplitRatio]);

  const startResizingDockTripleLeft = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "dock_triple_left";
    dragStartX.current = e.clientX;
    startDockTripleLeftRatio.current = dockTripleLeftRatio;
    startDockTripleRightRatio.current = dockTripleRightRatio;
    setIsResizing(true);
  }, [dockTripleLeftRatio, dockTripleRightRatio]);

  const startResizingDockTripleRight = useCallback((e: ReactMouseEvent) => {
    resizeMode.current = "dock_triple_right";
    dragStartX.current = e.clientX;
    startDockTripleLeftRatio.current = dockTripleLeftRatio;
    startDockTripleRightRatio.current = dockTripleRightRatio;
    setIsResizing(true);
  }, [dockTripleLeftRatio, dockTripleRightRatio]);

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
      // Permite estirar el dock area mucho mas (hasta que el Scene3D se quede sin espacio).
      // El limite duro anterior (820px) rompia el UX cuando el operador queria un HUD mas ancho.
      const max = Math.max(820, window.innerWidth - 260);
      const next = Math.max(360, Math.min(max, startRadarWidth.current + delta));
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
      return;
    }

    if (resizeMode.current === "dock_settings_split") {
      const delta = e.clientX - dragStartX.current;
      const laneWidth = Math.max(360, radarWidth);
      const next = startDockSettingsSplitRatio.current + delta / laneWidth;
      setDockSettingsSplitRatio(Math.max(0.24, Math.min(0.76, next)));
      document.body.style.cursor = "col-resize";
      return;
    }

    if (resizeMode.current === "dock_triple_left" || resizeMode.current === "dock_triple_right") {
      const delta = e.clientX - dragStartX.current;
      const laneWidth = Math.max(360, radarWidth);
      const d = delta / laneWidth;

      // Minimos relativos para evitar paneles imposibles. Como tenemos minWidth en UI,
      // aqui solo garantizamos separacion razonable entre separadores.
      const MIN_RADAR = 280 / laneWidth;
      const MIN_ATTACK = 340 / laneWidth;
      const MIN_SETTINGS = 320 / laneWidth;
      const MIN_EDGE = Math.max(0.18, MIN_RADAR);
      const MIN_GAP = Math.max(0.16, MIN_ATTACK);
      const MAX_RIGHT = Math.min(0.9, 1 - MIN_SETTINGS);

      if (resizeMode.current === "dock_triple_left") {
        const nextLeft = startDockTripleLeftRatio.current + d;
        const clampedLeft = Math.max(MIN_EDGE, Math.min(startDockTripleRightRatio.current - MIN_GAP, nextLeft));
        // Si el left se acerca demasiado al right, lo empujamos.
        const right = Math.max(clampedLeft + MIN_GAP, startDockTripleRightRatio.current);
        setDockTripleLeftRatio(clampedLeft);
        setDockTripleRightRatio(Math.min(MAX_RIGHT, right));
      } else {
        const nextRight = startDockTripleRightRatio.current + d;
        const clampedRight = Math.min(MAX_RIGHT, Math.max(startDockTripleLeftRatio.current + MIN_GAP, nextRight));
        setDockTripleRightRatio(clampedRight);
      }

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
    dockTripleLeftRatio,
    dockTripleRightRatio,
    dockSettingsSplitRatio,
    isResizing,
    startResizingSidebar,
    startResizingConsole,
    startResizingRadar,
    startResizingDockSplit,
    startResizingDockSettingsSplit,
    startResizingDockTripleLeft,
    startResizingDockTripleRight,
  };
};
