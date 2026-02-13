// src/ui/components/layout/DetachedWindowPortal.tsx
// Portal de ventana desacoplada (modo web): intenta abrir popup y, si falla, renderiza un overlay draggable en la ventana principal.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DetachedWindowPortalProps {
  title: string;
  onClose: () => void;
  width?: number;
  height?: number;
  children: React.ReactNode;
}

export const DetachedWindowPortal: React.FC<DetachedWindowPortalProps> = ({
  title,
  onClose,
  width = 1100,
  height = 760,
  children,
}) => {
  const containerEl = useMemo(() => document.createElement("div"), []);
  const winRef = useRef<Window | null>(null);
  const notifiedRef = useRef(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackPos, setFallbackPos] = useState({ x: 48, y: 48 });
  const dragRef = useRef<{ active: boolean; offsetX: number; offsetY: number }>({
    active: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    const popupWidth = Math.min(width, Math.floor(window.screen.availWidth * 0.82));
    const popupHeight = Math.min(height, Math.floor(window.screen.availHeight * 0.82));
    const next = window.open(
      "",
      "",
      `width=${popupWidth},height=${popupHeight},left=120,top=90,resizable=yes,scrollbars=no`
    );

    if (!next) {
      // Fallback: si el entorno bloquea popups, renderizamos en overlay dentro de la ventana principal.
      setFallbackMode(true);
      containerEl.dataset.detachedFallback = "true";
      containerEl.style.position = "fixed";
      containerEl.style.width = `${Math.max(480, Math.floor(window.innerWidth * 0.66))}px`;
      containerEl.style.height = `${Math.max(320, Math.floor(window.innerHeight * 0.62))}px`;
      containerEl.style.left = "48px";
      containerEl.style.top = "48px";
      containerEl.style.zIndex = "2147483647";
      containerEl.style.background = "#050505";
      containerEl.style.border = "1px solid #0a3";
      containerEl.style.boxShadow = "0 25px 80px rgba(0,0,0,0.7)";
      containerEl.style.overflow = "hidden";
      document.body.appendChild(containerEl);
      return () => {
        if (containerEl.parentNode) {
          containerEl.parentNode.removeChild(containerEl);
        }
      };
    }

    winRef.current = next;
    next.document.title = title;
    next.document.body.style.margin = "0";
    next.document.body.style.background = "#050505";
    next.document.body.style.overflow = "hidden";
    next.document.body.appendChild(containerEl);

    const checkClosed = window.setInterval(() => {
      if (!winRef.current || winRef.current.closed) {
        window.clearInterval(checkClosed);
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          onClose();
        }
      }
    }, 400);

    return () => {
      window.clearInterval(checkClosed);
      if (containerEl.parentNode) {
        containerEl.parentNode.removeChild(containerEl);
      }
      if (winRef.current && !winRef.current.closed) {
        winRef.current.close();
      }
      winRef.current = null;
    };
  }, [containerEl, height, onClose, title, width]);

  useEffect(() => {
    if (!fallbackMode) return;
    containerEl.style.left = `${fallbackPos.x}px`;
    containerEl.style.top = `${fallbackPos.y}px`;
  }, [containerEl, fallbackMode, fallbackPos.x, fallbackPos.y]);

  const onDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current.active = true;
    dragRef.current.offsetX = e.clientX - fallbackPos.x;
    dragRef.current.offsetY = e.clientY - fallbackPos.y;
  };

  useEffect(() => {
    if (!fallbackMode) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const maxX = Math.max(0, window.innerWidth - containerEl.offsetWidth);
      const maxY = Math.max(0, window.innerHeight - containerEl.offsetHeight);
      const nextX = Math.max(0, Math.min(maxX, e.clientX - dragRef.current.offsetX));
      const nextY = Math.max(0, Math.min(maxY, e.clientY - dragRef.current.offsetY));
      setFallbackPos({ x: nextX, y: nextY });
    };
    const onUp = () => {
      dragRef.current.active = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [containerEl, fallbackMode]);

  if (!fallbackMode) {
    return createPortal(children, containerEl);
  }

  return createPortal(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        onMouseDown={onDragStart}
        data-testid="detached-fallback-drag"
        style={{
          height: 30,
          background: "#03110a",
          borderBottom: "1px solid #0a3",
          color: "#8cfcc7",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px",
          cursor: "move",
          userSelect: "none",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.5,
        }}
      >
        <span>{title}</span>
        <button
          onClick={onClose}
          aria-label="DETACHED_FALLBACK_CLOSE"
          style={{
            width: 22,
            height: 22,
            border: "1px solid #0a3",
            background: "#001b0f",
            color: "#00ff88",
            cursor: "pointer",
            borderRadius: 2,
            padding: 0,
            lineHeight: "18px",
          }}
        >
          x
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>,
    containerEl
  );
};
