// src/ui/components/layout/main_docked/left_area/ResizeHandle.tsx
// Separador redimensionable del dock: handle reutilizable para split/triple (hover + aria-label) sin repetir estilos inline.

import React from "react";

export const ResizeHandle: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void;
  ariaLabel?: string;
  widthPx: number;
  bg: string;
  hoverBg: string;
  cursor?: React.CSSProperties["cursor"];
  zIndex?: number;
}> = ({ onMouseDown, ariaLabel, widthPx, bg, hoverBg, cursor = "col-resize", zIndex = 25 }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: `${widthPx}px`,
        background: bg,
        cursor,
        zIndex,
        flexShrink: 0,
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e) => (e.currentTarget.style.background = bg)}
      aria-label={ariaLabel}
    />
  );
};

