// src/ui/features/attack_lab/panel/WordlistManagerModal.tsx
// Modal de Password Vault: gestor de wordlist WiFi (AMMO BOX) + credenciales del gateway (Keyring) reutilizable desde Settings/Attack Lab.

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useWordlistManager } from "../../wordlist/hooks/useWordlistManager";
import { useGatewayCredentialPresets } from "./wordlist/hooks/useGatewayCredentialPresets";
import { CyberConfirmDialog } from "./wordlist/CyberConfirmDialog";
import { useI18n } from "../../../i18n";
import { networkAdapter } from "../../../../adapters/networkAdapter";
import type { GatewayCredentialsDTO, HostIdentity } from "../../../../shared/dtos/NetworkDTOs";
import { getRouterCandidates } from "../../../utils/routerCandidates";

interface WordlistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity?: HostIdentity | null;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0, 10, 5, 0.85)", backdropFilter: "blur(5px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 99999, padding: 20,
};

const modalContainerStyle: React.CSSProperties = {
  width: "100%", maxWidth: 600, height: "650px", maxHeight: "90vh",
  background: "#050505", border: "1px solid #00ff88",
  boxShadow: "0 0 50px rgba(0, 255, 136, 0.25)",
  display: "flex", flexDirection: "column", position: "relative",
  fontFamily: "'Consolas', monospace", overflow: "hidden", borderRadius: "4px",
  animation: "fadeIn 0.2s ease-out"
};

type VaultTab = "wifi_wordlist" | "gateway_creds";

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "10px 12px",
  borderBottom: "1px solid rgba(0,255,136,0.15)",
  background: "rgba(0,0,0,0.45)",
  flexShrink: 0,
};

const tabBtn = (active: boolean): React.CSSProperties => ({
  height: 28,
  padding: "0 10px",
  borderRadius: 2,
  border: `1px solid ${active ? "rgba(0,229,255,0.55)" : "rgba(0,255,136,0.25)"}`,
  background: active ? "rgba(0,229,255,0.12)" : "rgba(0,0,0,0.35)",
  color: active ? "#00e5ff" : "#00ff88",
  cursor: "pointer",
  fontFamily: "'Consolas', monospace",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.8,
  textTransform: "uppercase",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 34,
  background: "rgba(0,0,0,0.65)",
  border: "1px solid rgba(0,229,255,0.25)",
  color: "#b7ffe2",
  borderRadius: 2,
  fontFamily: "'Consolas', monospace",
  fontSize: 12,
  padding: "0 10px",
  outline: "none",
};

const btnStyle = (variant: "primary" | "danger" | "ghost"): React.CSSProperties => {
  if (variant === "primary") {
    return {
      height: 34,
      padding: "0 14px",
      borderRadius: 2,
      border: "1px solid rgba(0,255,136,0.35)",
      background: "rgba(0,255,136,0.12)",
      color: "#00ff88",
      cursor: "pointer",
      fontFamily: "'Consolas', monospace",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    };
  }
  if (variant === "danger") {
    return {
      height: 34,
      padding: "0 14px",
      borderRadius: 2,
      border: "1px solid rgba(255,85,85,0.45)",
      background: "rgba(255,85,85,0.08)",
      color: "#ff6677",
      cursor: "pointer",
      fontFamily: "'Consolas', monospace",
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    };
  }
  return {
    height: 34,
    padding: "0 12px",
    borderRadius: 2,
    border: "1px solid rgba(0,255,136,0.25)",
    background: "rgba(0,0,0,0.35)",
    color: "rgba(183,255,226,0.85)",
    cursor: "pointer",
    fontFamily: "'Consolas', monospace",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  };
};

export const WordlistManagerModal: React.FC<WordlistManagerModalProps> = ({ isOpen, onClose, identity = null }) => {
  const { t } = useI18n();
  const { state, actions } = useWordlistManager(isOpen);
  const [newWord, setNewWord] = useState("");
  const [editValue, setEditValue] = useState("");
  const [tab, setTab] = useState<VaultTab>("wifi_wordlist");

  // Gateway IP puede venir de `identity`, pero debe ser editable para:
  // - casos en los que identity aun no esta disponible al abrir el modal
  // - casos de entornos multi-gateway (usuario quiere apuntar a otro)
  const [gatewayIpInput, setGatewayIpInput] = useState("");
  const gatewayIp = useMemo(() => gatewayIpInput.trim(), [gatewayIpInput]);
  const canManageCreds = useMemo(() => Boolean(gatewayIp && /^\d{1,3}(\.\d{1,3}){3}$/.test(gatewayIp)), [gatewayIp]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [creds, setCreds] = useState<GatewayCredentialsDTO | null>(null);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [gatewayCandidates, setGatewayCandidates] = useState<Array<{ ip: string; label: string }>>([]);
  const [selectedGateways, setSelectedGateways] = useState<Set<string>>(new Set());
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [showBatchTargets, setShowBatchTargets] = useState(false);
  const [gatewayFormDirty, setGatewayFormDirty] = useState(false);
  const gatewayPresets = useGatewayCredentialPresets(isOpen, canManageCreds ? gatewayIp : null);

  const handleAdd = () => {
      actions.addWord(newWord);
      setNewWord("");
  };

  // Handlers locales para edición (input controlado)
  const startEditing = (word: string) => {
      actions.setEditingWord(word);
      setEditValue(word);
  };

  const saveEditing = (oldWord: string) => {
      actions.updateWord(oldWord, editValue);
  };

  useEffect(() => {
    if (!isOpen) return;
    setTab("wifi_wordlist"); // Abre directo al AMMO BOX, como pediste.
    setStatus(null);
    setShowPass(false);
    setGatewayIpInput(identity?.gatewayIp ?? "");
    setSelectedGateways(new Set());
    setActiveGateway(identity?.gatewayIp ?? null);
    setLoadingCreds(false);
    setGatewayFormDirty(false);
  }, [isOpen]);

  // Cuando cambia el gateway activo, consideramos el formulario "limpio" y permitimos
  // que el auto-load rellene USER/PASS desde Keyring. Si el operador toca el formulario
  // (presets o typing), no volvemos a sobreescribir automáticamente.
  useEffect(() => {
    if (!isOpen) return;
    setGatewayFormDirty(false);
    setStatus(null);
  }, [isOpen, gatewayIp]);

  // Carga candidatos desde el ultimo snapshot: permite desplegable de targets (routers/gateways conocidos).
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const snap = await networkAdapter.loadLatestSnapshot();
        if (cancelled) return;
        if (!snap?.devices?.length) {
          setGatewayCandidates([]);
          return;
        }

        const routerCandidates = identity ? getRouterCandidates(snap.devices, identity) : [];
        const list = (routerCandidates.length ? routerCandidates : snap.devices)
          .map((d) => ({
            ip: d.ip,
            label: `${d.name || d.ip} (${d.vendor || "Unknown"})`,
          }))
          // Evita duplicados por IP
          .filter((x, idx, arr) => arr.findIndex((y) => y.ip === x.ip) === idx);

        setGatewayCandidates(list);
      } catch {
        // Silencioso: si no hay snapshot aun, el usuario puede escribir manualmente.
        setGatewayCandidates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, identity]);

  useEffect(() => {
    if (!isOpen) return;
    if (!canManageCreds) {
      setCreds(null);
      setLoadingCreds(false);
      return;
    }
    let cancelled = false;
    setLoadingCreds(true);
    void (async () => {
      try {
        const load = networkAdapter.getGatewayCredentials(gatewayIp);
        // Evita que una llamada colgada deje la UI bloqueada (inputs deshabilitados).
        const current = await Promise.race([
          load,
          new Promise<GatewayCredentialsDTO | null>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500)),
        ]);
        if (cancelled) return;
        setCreds(current);
        // Importante: si el operador ya ha tocado el formulario (preset/typing), no pisamos
        // sus valores con el auto-load. Solo rellenamos si el form esta "limpio".
        if (!gatewayFormDirty) {
          setUser(current?.user ?? "");
          setPass(current?.pass ?? "");
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error && e.message === "timeout"
          ? t("settings.passwords.status.loadTimeout")
          : `${t("settings.passwords.status.loadError")}: ${String(e)}`;
        setStatus(msg);
      } finally {
        if (!cancelled) setLoadingCreds(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, canManageCreds, gatewayIp, t, gatewayFormDirty]);

  const modalContent = (
    <div style={overlayStyle} onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .word-chip { transition: all 0.1s; user-select: none; }
        .word-chip.selected {
            background: #00ff88 !important; color: #000 !important; border-color: #00ff88 !important; font-weight: bold;
        }
        .word-chip:hover { border-color: #555; background: #161616; }
        .word-chip.selected:hover { background: #00cc6a !important; }
        .cyber-scrollbar::-webkit-scrollbar { width: 6px; }
        .cyber-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>
      
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
          <div className="cyber-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 15, background: "rgba(0,0,0,0.3)", minHeight: 0 }}>
            {state.loading ? (
              <div style={{ color: "#555", textAlign: "center", padding: 20 }}>{t("wordlist.loading")}</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: 'flex-start' }}>
                {state.words.map((w, i) => {
                  const isSelected = state.selectedWords.has(w);
                  const isEditing = state.editingWord === w;
                  
                  return (
                      <div 
                          key={i} 
                          className={`word-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => !isEditing && actions.toggleSelection(w)}
                          style={{ 
                              background: isEditing ? "#000" : "#111", 
                              border: isEditing ? "1px solid #00ff88" : (isSelected ? "1px solid #00ff88" : "1px solid #333"), 
                              color: isEditing ? "#00ff88" : (isSelected ? "#000" : "#ccc"), 
                              padding: "6px 10px", fontSize: "0.85rem", borderRadius: 2,
                              display: "flex", alignItems: "center", gap: 8, cursor: 'pointer'
                          }}
                      >
                      {isEditing ? (
                          <input 
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveEditing(w)}
                              onKeyDown={(e) => e.key === "Enter" ? saveEditing(w) : (e.key === "Escape" && actions.setEditingWord(null))}
                              onClick={(e) => e.stopPropagation()}
                              style={{ background: "transparent", border: "none", color: "#00ff88", outline: "none", width: "100px", fontFamily: "inherit", fontWeight: "bold" }}
                          />
                      ) : (
                          <>
                              <span 
                                  onDoubleClick={(e) => { e.stopPropagation(); startEditing(w); }} 
                                  title={t("wordlist.wordHint")}
                              >
                                  {w}
                              </span>
                              {!isSelected && (
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); actions.requestDelete(w); }} 
                                      style={{ background: "transparent", border: "none", color: "#ff5555", cursor: "pointer", fontWeight: "bold", padding: 0, opacity: 0.6, lineHeight: 0.5 }}
                                  >×</button>
                              )}
                          </>
                      )}
                      </div>
                  );
                })}
                <div ref={state.listEndRef} />
              </div>
            )}
          </div>
        ) : (
          <div className="cyber-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 15, background: "rgba(0,0,0,0.3)", minHeight: 0 }}>
            <div style={{ color: "rgba(183,255,226,0.8)", fontSize: 11, lineHeight: 1.45, marginBottom: 10 }}>
              {t("settings.passwords.gateway.help")}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 4 }}>
                  {t("settings.passwords.gateway.gatewayIp")}
                </div>
                {gatewayCandidates.length > 0 && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <select
                      value={activeGateway ?? ""}
                      onChange={(e) => {
                        const ip = e.target.value || null;
                        setActiveGateway(ip);
                        setGatewayIpInput(ip ?? "");
                        if (ip) {
                          const next = new Set(selectedGateways);
                          next.add(ip);
                          setSelectedGateways(next);
                        }
                      }}
                      style={{ ...inputStyle, flex: 1 }}
                      aria-label="VAULT_GATEWAY_TARGET_SELECT"
                      disabled={loadingCreds}
                    >
                      <option value="">{t("settings.passwords.gateway.selectTarget")}</option>
                      {gatewayCandidates.map((c) => (
                        <option key={c.ip} value={c.ip}>
                          {c.ip} - {c.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      style={{ ...btnStyle("ghost"), height: 34 }}
                      onClick={() => setShowBatchTargets((v) => !v)}
                      disabled={gatewayCandidates.length === 0}
                      aria-label="VAULT_GATEWAY_BATCH_TOGGLE"
                      title={t("settings.passwords.gateway.targetsTitle")}
                    >
                      {t("settings.passwords.gateway.targetsTitle")} ({selectedGateways.size})
                    </button>
                  </div>
                )}
                <input
                  value={gatewayIpInput}
                  onChange={(e) => setGatewayIpInput(e.target.value)}
                  placeholder={t("settings.passwords.gateway.unknownGateway")}
                  style={inputStyle}
                  // No bloquear input aunque la carga de keyring/tauri se quede colgada.
                  disabled={false}
                  aria-label="VAULT_GATEWAY_IP_INPUT"
                />
              </div>

              {!canManageCreds && (
                <div
                  style={{
                    border: "1px solid rgba(255,180,0,0.28)",
                    background: "rgba(255,180,0,0.08)",
                    color: "rgba(255,220,170,0.95)",
                    padding: "10px 10px",
                    borderRadius: 2,
                    fontSize: 11,
                    lineHeight: 1.35,
                  }}
                  aria-label="VAULT_GATEWAY_MISSING_IP"
                >
                  {t("settings.passwords.gateway.missingGatewayIp")}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 4 }}>
                    {t("settings.passwords.gateway.user")}
                  </div>
                  <input value={user} onChange={(e) => { setUser(e.target.value); setGatewayFormDirty(true); }} style={inputStyle} disabled={!canManageCreds} />
                </div>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 4 }}>
                    {t("settings.passwords.gateway.pass")}
                  </div>
                  <input value={pass} onChange={(e) => { setPass(e.target.value); setGatewayFormDirty(true); }} style={inputStyle} type={showPass ? "text" : "password"} disabled={!canManageCreds} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" style={btnStyle("ghost")} onClick={() => setShowPass((v) => !v)} disabled={!canManageCreds || loadingCreds}>
                  {showPass ? t("settings.passwords.gateway.hidePass") : t("settings.passwords.gateway.showPass")}
                </button>
                <button
                  type="button"
                  style={btnStyle("primary")}
                  onClick={async () => {
                    if (!canManageCreds) return;
                    setStatus(null);
                    try {
                      await networkAdapter.saveGatewayCredentials(gatewayIp, user.trim(), pass);
                      const current = await networkAdapter.getGatewayCredentials(gatewayIp);
                      setCreds(current);
                      if (!current) {
                        setStatus(t("settings.passwords.status.saveNotVerified"));
                      } else {
                        setStatus(t("settings.passwords.status.saved"));
                        // UX: al guardar creds del gateway, tambien persistimos el par user/pass
                        // como preset del gateway para reutilizacion rapida (sin otro boton extra).
                        await gatewayPresets.actions.add(user.trim(), pass);
                        // Asegura refresh (dedup/union) incluso si el backend no cambia visiblemente la lista.
                        await gatewayPresets.actions.load(gatewayIp);
                      }
                      setGatewayFormDirty(false);
                    } catch (e) {
                      setStatus(`${t("settings.passwords.status.saveError")}: ${String(e)}`);
                    }
                  }}
                  disabled={!canManageCreds || loadingCreds || !user.trim() || !pass}
                >
                  {t("settings.passwords.gateway.save")}
                </button>
                <button
                  type="button"
                  style={btnStyle("danger")}
                  onClick={async () => {
                    if (!canManageCreds) return;
                    setStatus(null);
                    try {
                      await networkAdapter.deleteGatewayCredentials(gatewayIp);
                      const after = await networkAdapter.getGatewayCredentials(gatewayIp);
                      setCreds(after);
                      if (after) {
                        setStatus(t("settings.passwords.status.deleteNotVerified"));
                      } else {
                        setUser("");
                        setPass("");
                        setStatus(t("settings.passwords.status.deleted"));
                      }
                      setGatewayFormDirty(false);
                    } catch (e) {
                      setStatus(`${t("settings.passwords.status.deleteError")}: ${String(e)}`);
                    }
                  }}
                  // Borrar debe ser idempotente: si no hay creds guardadas, el backend puede no-op y la UI igual debe permitirlo.
                  disabled={!canManageCreds || loadingCreds}
                >
                  {t("settings.passwords.gateway.delete")}
                </button>
              </div>

              {gatewayCandidates.length > 0 && showBatchTargets && (
                <div style={{ marginTop: 8, borderTop: "1px solid rgba(0,255,136,0.12)", paddingTop: 10 }}>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.75)", marginBottom: 8 }}>
                    {t("settings.passwords.gateway.targetsTitle")} ({selectedGateways.size})
                  </div>

                  <div
                    className="cyber-scrollbar"
                    style={{
                      maxHeight: 160,
                      overflowY: "auto",
                      border: "1px solid rgba(0,255,136,0.14)",
                      background: "rgba(0,0,0,0.35)",
                      borderRadius: 2,
                      padding: 6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                    aria-label="VAULT_GATEWAY_BATCH_LIST"
                  >
                    {gatewayCandidates.map((c) => {
                      const checked = selectedGateways.has(c.ip);
                      const active = activeGateway === c.ip;
                      return (
                        <label
                          key={c.ip}
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            padding: "6px 8px",
                            borderRadius: 2,
                            cursor: "pointer",
                            border: `1px solid ${active ? "rgba(0,229,255,0.35)" : "rgba(0,255,136,0.10)"}`,
                            background: active ? "rgba(0,229,255,0.06)" : "rgba(0,0,0,0.25)",
                          }}
                          aria-label={`VAULT_GATEWAY_BATCH_ITEM_${c.ip}`}
                          onClick={() => {
                            // Click en la fila => lo convierte tambien en target activo (rapido).
                            setActiveGateway(c.ip);
                            setGatewayIpInput(c.ip);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(selectedGateways);
                              e.target.checked ? next.add(c.ip) : next.delete(c.ip);
                              setSelectedGateways(next);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 900, letterSpacing: 0.4, color: active ? "#00e5ff" : "#00ff88", fontSize: 12 }}>
                              {c.ip}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {c.label}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      style={{ ...btnStyle("ghost"), flex: 1 }}
                      onClick={() => setSelectedGateways(new Set())}
                      disabled={selectedGateways.size === 0}
                    >
                      {t("settings.passwords.gateway.deselectAll")}
                    </button>
                    <button
                      type="button"
                      style={{ ...btnStyle("danger"), flex: 2 }}
                      onClick={async () => {
                        if (selectedGateways.size === 0) return;
                        setStatus(null);
                        try {
                          const ips = Array.from(selectedGateways);
                          await Promise.all(ips.map((ip) => networkAdapter.deleteGatewayCredentials(ip)));
                          // Si el activo fue borrado, limpia el formulario
                          if (activeGateway && selectedGateways.has(activeGateway)) {
                            setCreds(null);
                            setUser("");
                            setPass("");
                          }
                          setSelectedGateways(new Set());
                          setStatus(t("settings.passwords.status.deleted"));
                        } catch (e) {
                          setStatus(`${t("settings.passwords.status.deleteError")}: ${String(e)}`);
                        }
                      }}
                      disabled={selectedGateways.size === 0 || loadingCreds}
                    >
                      {t("settings.passwords.gateway.deleteSelected")}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "rgba(183,255,226,0.6)" }}>
                  {t("settings.passwords.gateway.presetsLabel")}
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                {gatewayPresets.state.loading ? (
                  <div style={{ color: "rgba(183,255,226,0.6)", fontSize: 11 }}>{t("settings.passwords.status.loading")}</div>
                ) : gatewayPresets.state.items.length === 0 ? (
                  <div style={{ color: "rgba(183,255,226,0.55)", fontSize: 11 }}>{t("settings.passwords.gateway.presets.empty")}</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }} aria-label="GATEWAY_PRESET_LIST">
                    {gatewayPresets.state.items.map((p) => {
                      const key = `${p.gatewayIp}\n${p.user}\n${p.pass}`;
                      const selected = gatewayPresets.state.selected.has(key);
                      const isGlobal = p.gatewayIp === "*";
                      return (
                        <div
                          key={key}
                          className={`word-chip ${selected ? "selected" : ""}`}
                          onClick={() => {
                            // Click simple: rellena el formulario con ese preset
                            setUser(p.user);
                            setPass(p.pass);
                            setGatewayFormDirty(true);
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            gatewayPresets.actions.toggle(p);
                          }}
                          title={t("settings.passwords.gateway.presets.hint")}
                          style={{
                            background: "#111",
                            border: selected ? "1px solid #00ff88" : (isGlobal ? "1px solid rgba(0,180,255,0.35)" : "1px solid rgba(0,255,136,0.18)"),
                            color: selected ? "#000" : "#ccc",
                            padding: "6px 10px",
                            fontSize: "0.85rem",
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            userSelect: "none",
                          }}
                          aria-label={`GATEWAY_PRESET_${p.gatewayIp}_${p.user}_${p.pass}`}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 900,
                              letterSpacing: 1,
                              textTransform: "uppercase",
                              padding: "2px 5px",
                              borderRadius: 2,
                              border: isGlobal ? "1px solid rgba(0,180,255,0.5)" : "1px solid rgba(0,255,136,0.25)",
                              color: isGlobal ? "rgba(120,220,255,0.95)" : "rgba(183,255,226,0.75)",
                              background: isGlobal ? "rgba(0,180,255,0.08)" : "rgba(0,255,136,0.06)",
                            }}
                            title={isGlobal ? t("settings.passwords.gateway.presets.scope.global") : p.gatewayIp}
                          >
                            {isGlobal ? t("settings.passwords.gateway.presets.scope.global") : p.gatewayIp}
                          </span>
                          <span style={{ fontWeight: 900, color: selected ? "#000" : "#00ff88" }}>{p.user}</span>
                          <span style={{ opacity: 0.9 }}>/</span>
                          <span style={{ fontWeight: 700 }}>{p.pass}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {gatewayPresets.state.selected.size > 0 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <button type="button" style={{ ...btnStyle("ghost"), flex: 1 }} onClick={gatewayPresets.actions.deselectAll}>
                      {t("settings.passwords.gateway.presets.deselect")} ({gatewayPresets.state.selected.size})
                    </button>
                    <button
                      type="button"
                      style={{ ...btnStyle("danger"), flex: 2 }}
                      onClick={async () => {
                        try {
                          setStatus(null);
                          const count = gatewayPresets.state.selected.size;
                          await gatewayPresets.actions.removeSelected();
                          setStatus(`${t("settings.passwords.gateway.presets.status.deleted")}: ${count}`);
                        } catch (e) {
                          setStatus(`${t("settings.passwords.gateway.presets.status.deleteError")}: ${String(e)}`);
                        }
                      }}
                    >
                      {t("settings.passwords.gateway.presets.deleteSelected")}
                    </button>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, color: "rgba(183,255,226,0.75)", lineHeight: 1.45 }}>
                {loadingCreds ? t("settings.passwords.status.loading") : ""}
                {!loadingCreds && creds?.savedAt ? (
                  <div>
                    {t("settings.passwords.gateway.savedAt")}: {new Date(creds.savedAt).toLocaleString()}
                  </div>
                ) : null}
                {status ? <div style={{ marginTop: 6, color: status.includes("ERROR") ? "#ff6677" : "#00ff88" }}>{status}</div> : null}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        {tab === "wifi_wordlist" && (
          <div style={{ padding: 15, borderTop: "1px solid #333", background: "#080808", flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              {state.selectedWords.size > 0 ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={actions.deselectAll} style={{ flex: 1, background: '#222', color: '#888', border: '1px solid #444', padding: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                          {t("wordlist.actions.deselect")} ({state.selectedWords.size})
                      </button>
                      <button onClick={() => actions.requestDelete()} style={{ flex: 2, background: '#300', color: '#f55', border: '1px solid #f00', padding: 12, cursor: 'pointer', fontWeight: 'bold' }}>
                          {t("wordlist.actions.deleteSelected")}
                      </button>
                  </div>
              ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                      <input 
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                          placeholder={t("wordlist.inputPlaceholder")}
                          style={{ flex: 1, background: "#000", border: "1px solid #333", color: "#fff", padding: "12px", fontFamily: "inherit", outline: "none", fontSize: "0.9rem" }}
                      />
                      <button onClick={handleAdd} style={{ background: "rgba(0, 255, 136, 0.1)", border: "1px solid #00ff88", color: "#00ff88", fontWeight: "bold", padding: "0 25px", cursor: "pointer" }}>
                          {t("wordlist.actions.add")}
                      </button>
                  </div>
              )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Importante: se renderiza en un portal al `document.body` del window actual para evitar
  // recortes por `overflow/transform` en contenedores (Dock/Detached layouts).
  return createPortal(modalContent, document.body);
};
