// src/ui/features/traffic/components/TrafficTable.tsx
// Tabla del TrafficPanel: render de paquetes visibles + estados (paused/waiting) y scroll incremental.
import React from "react";
import type { FilterMode, UITrafficPacket } from "../hooks/useTrafficPanelState";
import { HUD_TYPO } from "../../../styles/hudTokens";
import { gridTemplate } from "./TrafficStyles";
import { useI18n } from "../../../i18n";

type TrafficTableProps = {
  isActive: boolean;
  filterMode: FilterMode;
  visiblePackets: UITrafficPacket[];
  filteredPacketsCount: number;
  visibleLimit: number;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  resolveName: (ip: string) => string;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

export const TrafficTable: React.FC<TrafficTableProps> = ({
  isActive,
  filterMode,
  visiblePackets,
  filteredPacketsCount,
  visibleLimit,
  onScroll,
  resolveName,
  scrollContainerRef,
}) => {
  const { t } = useI18n();
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridTemplate,
          gap: "5px",
          padding: "4px 0",
          borderBottom: "1px solid #222",
          color: "#008800",
          fontWeight: "bold",
          fontSize: "0.65rem",
          background: "#080808",
        }}
      >
        <span style={{ paddingLeft: 5 }}>{t("traffic.table.type")}</span>
        <span>{t("traffic.table.src")}</span>
        <span />
        <span>{t("traffic.table.dst")}</span>
        <span style={{ textAlign: "right", paddingRight: 5 }}>{t("traffic.table.data")}</span>
      </div>

      <div ref={scrollContainerRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", padding: "2px" }}>
        {visiblePackets.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#444", fontSize: "0.7rem", fontFamily: HUD_TYPO.mono }}>
            {isActive ? t("traffic.state.waiting") : t("traffic.state.paused")}
            <div style={{ marginTop: 5, fontSize: "0.6rem" }}>{t("traffic.filter.label")}: {filterMode}</div>
            {filterMode === "JAMMED" && <div style={{ color: "#633", marginTop: 10 }}>{t("traffic.filter.jammedEmpty")}</div>}
          </div>
        ) : (
          visiblePackets.map((pkt, idx) => {
            const isBlocked = pkt.isIntercepted;
            const uniqueKey = pkt._uiId || `${pkt.id}-${idx}`;
            return (
              <div
                key={uniqueKey}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridTemplate,
                  gap: "5px",
                  padding: "3px 0",
                  borderBottom: "1px solid #111",
                  alignItems: "center",
                  fontFamily: HUD_TYPO.mono,
                  fontSize: "0.7rem",
                  backgroundColor: isBlocked ? "rgba(100, 0, 0, 0.2)" : "transparent",
                  color: isBlocked ? "#ff5555" : pkt.protocol === "TCP" ? "#8f8" : "#ff8",
                  animation: idx < 3 ? "flashNew 0.5s ease-out" : "none",
                }}
              >
                <style>{`
                  @keyframes flashNew {
                    0% { background-color: rgba(0, 255, 0, 0.2); transform: translateX(-5px); }
                    100% { background-color: transparent; transform: translateX(0); }
                  }
                `}</style>
                <span style={{ fontWeight: "bold", paddingLeft: 5 }}>{isBlocked ? "BLK" : pkt.protocol}</span>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{resolveName(pkt.sourceIp)}</span>
                <span style={{ color: "#444", fontSize: "0.6rem" }}>{">"}</span>
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textDecoration: isBlocked ? "line-through" : "none",
                    opacity: isBlocked ? 0.6 : 1,
                  }}
                >
                  {resolveName(pkt.destinationIp)}
                </span>
                <span style={{ textAlign: "right", paddingRight: 5, whiteSpace: "nowrap", overflow: "hidden", opacity: 0.7 }}>
                  {pkt.info}
                </span>
              </div>
            );
          })
        )}

        {visibleLimit < filteredPacketsCount ? (
          <div style={{ textAlign: "center", padding: 10, color: "#004400", fontSize: "0.7rem" }}>{t("traffic.scrollMore")}</div>
        ) : (
          filteredPacketsCount > 0 && (
            <div style={{ textAlign: "center", padding: 10, color: "#440000", fontSize: "0.7rem", borderTop: "1px solid #330000" }}>
              --- {t("traffic.endOfBuffer")} ({filteredPacketsCount}) ---
            </div>
          )
        )}
      </div>
    </>
  );
};
