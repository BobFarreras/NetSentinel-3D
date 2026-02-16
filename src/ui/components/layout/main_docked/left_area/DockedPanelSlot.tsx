// src/ui/components/layout/main_docked/left_area/DockedPanelSlot.tsx
// Slot de panel docked: cabecera DockHeader + cuerpo flex para incrustar Radar/AttackLab/Settings sin repetir estructura.

import React, { Suspense } from "react";
import { DockHeader } from "../PanelHeaders";
import type { DetachablePanelId } from "../../../../../adapters/windowingAdapter";

export const DockedPanelSlot: React.FC<{
  title: string;
  panelId: DetachablePanelId;
  onUndock: (panel: DetachablePanelId) => void;
  onClose: () => void;
  undockTitle: string;
  closeTitle: string;
  minWidthPx: number;
  widthCss?: string;
  children: React.ReactNode;
}> = ({ title, panelId, onUndock, onClose, undockTitle, closeTitle, minWidthPx, widthCss, children }) => {
  return (
    <div
      style={{
        width: widthCss ?? undefined,
        minWidth: minWidthPx,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <DockHeader
        title={title}
        onUndock={() => void onUndock(panelId)}
        onClose={onClose}
        undockTitle={undockTitle}
        closeTitle={closeTitle}
      />
      <div style={{ flex: 1, minHeight: 0 }}>
        <Suspense fallback={null}>{children}</Suspense>
      </div>
    </div>
  );
};

