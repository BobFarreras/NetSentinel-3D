// src/ui/features/attack_lab/panel/WordlistManagerModal.tsx
// Modal de Password Vault: gestor de wordlist WiFi (AMMO BOX) + credenciales del gateway (Keyring) reutilizable desde Settings/Attack Lab.

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useWordlistManager } from "../../wordlist/hooks/useWordlistManager";
import { CyberConfirmDialog } from "./wordlist/CyberConfirmDialog";
import { useI18n } from "../../../i18n";
import type { HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { WordlistGrid } from "./wordlist/WordlistGrid";
import { WordlistFooter } from "./wordlist/WordlistFooter";
import { GatewayCredsTab } from "./wordlist/GatewayCredsTab";
import { useGatewayCredsVault } from "./wordlist/hooks/useGatewayCredsVault";
import { modalContainerStyle, modalCssText, overlayStyle, tabBarStyle, tabBtn } from "./wordlist/wordlistManagerModalStyles";

interface WordlistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity?: HostIdentity | null;
}

type VaultTab = "wifi_wordlist" | "gateway_creds";

export const WordlistManagerModal: React.FC<WordlistManagerModalProps> = ({ isOpen, onClose, identity = null }) => {
  const { t } = useI18n();
  const { state, actions } = useWordlistManager(isOpen);
  const [tab, setTab] = useState<VaultTab>("wifi_wordlist");
  const gatewayVault = useGatewayCredsVault(isOpen, identity);

  useEffect(() => {
    if (!isOpen) return;
    setTab("wifi_wordlist"); // Abre directo al AMMO BOX, como pediste.
  }, [isOpen]);

  const modalContent = (
    <div style={overlayStyle} onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <style>{modalCssText}</style>
      
      <div style={modalContainerStyle}>
        
        {state.isDeleting && (
          <CyberConfirmDialog 
            count={state.selectedWords.size} 
            word={state.selectedWords.size === 1 ? Array.from(state.selectedWords)[0] : undefined}
            onConfirm={actions.confirmDelete} 
            onCancel={() => actions.setIsDeleting(false)} 
          />
        )}

        {/* HEADER */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #00ff88", background: "rgba(0, 255, 136, 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
             <span style={{ color: "#00ff88", fontWeight: 900, letterSpacing: 2, fontSize: "1.05rem" }}>{t("settings.passwords.title")}</span>
             {tab === "wifi_wordlist" && state.selectedWords.size > 0 && (
                 <span style={{ background: '#00ff88', color: '#000', padding: '2px 6px', fontSize: 10, fontWeight: 'bold', borderRadius: 2 }}>
                     {state.selectedWords.size} {t("wordlist.selectedSuffix")}
                 </span>
             )}
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#00ff88", cursor: "pointer", fontWeight: "bold", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
        </div>

        <div style={tabBarStyle}>
          <button onClick={() => setTab("wifi_wordlist")} style={tabBtn(tab === "wifi_wordlist")} aria-label="VAULT_TAB_WIFI">
            {t("settings.passwords.tabs.wifiWordlist")}
          </button>
          <button onClick={() => setTab("gateway_creds")} style={tabBtn(tab === "gateway_creds")} aria-label="VAULT_TAB_GATEWAY">
            {t("settings.passwords.tabs.gatewayCreds")}
          </button>
        </div>

        {/* BODY */}
        {tab === "wifi_wordlist" ? (
          <WordlistGrid
            words={state.words}
            loading={state.loading}
            selectedWords={state.selectedWords}
            editingWord={state.editingWord}
            listEndRef={state.listEndRef}
            onSelect={actions.toggleSelection}
            onEditStart={(w) => actions.setEditingWord(w)}
            onEditSave={(oldW, newW) => actions.updateWord(oldW, newW)}
            onDeleteRequest={(w) => actions.requestDelete(w)}
          />
        ) : (
          <GatewayCredsTab vault={gatewayVault} />

        )}

        {/* FOOTER */}
        {tab === "wifi_wordlist" && (
          <WordlistFooter
            selectionCount={state.selectedWords.size}
            totalCount={state.words.length}
            onAdd={(word) => actions.addWord(word)}
            onDeselect={actions.deselectAll}
            onDeleteSelected={() => actions.requestDelete()}
          />
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Importante: se renderiza en un portal al `document.body` del window actual para evitar
  // recortes por `overflow/transform` en contenedores (Dock/Detached layouts).
  return createPortal(modalContent, document.body);
};
