// src/ui/features/attack_lab/panel/wordlist/hooks/useGatewayCredsVault.ts
// Hook de estado para el tab Gateway Creds del Password Vault: carga candidatos, keyring creds y coordina presets por gateway.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GatewayCredentialsDTO, HostIdentity } from "../../../../../../shared/dtos/NetworkDTOs";
import { networkAdapter } from "../../../../../../adapters/networkAdapter";
import { getRouterCandidates } from "../../../../../utils/routerCandidates";
import { useGatewayCredentialPresets } from "./useGatewayCredentialPresets";

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

export type VaultStatus =
  | { kind: "idle" }
  | { kind: "load_timeout" }
  | { kind: "load_error"; error: string }
  | { kind: "save_not_verified" }
  | { kind: "saved" }
  | { kind: "save_error"; error: string }
  | { kind: "delete_not_verified" }
  | { kind: "deleted" }
  | { kind: "delete_error"; error: string }
  | { kind: "preset_deleted"; count: number }
  | { kind: "preset_delete_error"; error: string };

export interface GatewayCandidate {
  ip: string;
  label: string;
}

export interface GatewayCredsVaultState {
  gatewayIpInput: string;
  gatewayIp: string;
  canManageCreds: boolean;
  loadingCreds: boolean;
  creds: GatewayCredentialsDTO | null;
  user: string;
  pass: string;
  showPass: boolean;
  status: VaultStatus;
  gatewayCandidates: GatewayCandidate[];
  selectedGateways: Set<string>;
  activeGateway: string | null;
  showBatchTargets: boolean;
  gatewayFormDirty: boolean;
}

export interface GatewayCredsVaultActions {
  setGatewayIpInput: (v: string) => void;
  setActiveGateway: (ip: string | null) => void;
  activateGateway: (ip: string | null) => void;
  setShowBatchTargets: (v: boolean) => void;
  toggleGatewaySelected: (ip: string, nextChecked: boolean) => void;
  clearSelectedGateways: () => void;
  setUser: (v: string) => void;
  setPass: (v: string) => void;
  toggleShowPass: () => void;
  setStatus: (s: VaultStatus) => void;
  saveCreds: () => Promise<void>;
  deleteCreds: () => Promise<void>;
  deleteSelectedGateways: () => Promise<void>;
  resetOnOpen: () => void;
  applyPresetToForm: (user: string, pass: string) => void;
  presets: ReturnType<typeof useGatewayCredentialPresets>;
}

export const useGatewayCredsVault = (isOpen: boolean, identity: HostIdentity | null) => {
  const [gatewayIpInput, setGatewayIpInput] = useState("");
  const gatewayIp = useMemo(() => gatewayIpInput.trim(), [gatewayIpInput]);
  const canManageCreds = useMemo(() => Boolean(gatewayIp && IPV4_RE.test(gatewayIp)), [gatewayIp]);

  // Evita condiciones de carrera: un auto-load antiguo no debe pisar el estado despues de guardar/borrar.
  const credsLoadSeq = useRef(0);

  const [loadingCreds, setLoadingCreds] = useState(false);
  const [creds, setCreds] = useState<GatewayCredentialsDTO | null>(null);
  const [user, setUserInternal] = useState("");
  const [pass, setPassInternal] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<VaultStatus>({ kind: "idle" });

  const [gatewayCandidates, setGatewayCandidates] = useState<GatewayCandidate[]>([]);
  const [selectedGateways, setSelectedGateways] = useState<Set<string>>(new Set());
  const [activeGateway, setActiveGateway] = useState<string | null>(null);
  const [showBatchTargets, setShowBatchTargets] = useState(false);
  const [gatewayFormDirty, setGatewayFormDirty] = useState(false);

  const presets = useGatewayCredentialPresets(isOpen, canManageCreds ? gatewayIp : null);

  const resetOnOpen = useCallback(() => {
    credsLoadSeq.current += 1;
    setStatus({ kind: "idle" });
    setShowPass(false);
    const ip = identity?.gatewayIp ?? "";
    setGatewayIpInput(ip);
    setSelectedGateways(new Set());
    setActiveGateway(ip || null);
    setLoadingCreds(false);
    setGatewayFormDirty(false);
  }, [identity]);

  const activateGateway = useCallback((ip: string | null) => {
    setActiveGateway(ip);
    setGatewayIpInput(ip ?? "");
    if (ip) {
      setSelectedGateways((prev) => {
        const next = new Set(prev);
        next.add(ip);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    resetOnOpen();
  }, [isOpen, resetOnOpen]);

  // Cuando cambia el gateway (IP), consideramos el formulario "limpio" y dejamos que el auto-load rellene USER/PASS.
  useEffect(() => {
    if (!isOpen) return;
    setGatewayFormDirty(false);
    setStatus({ kind: "idle" });
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
          .filter((x, idx, arr) => arr.findIndex((y) => y.ip === x.ip) === idx);

        setGatewayCandidates(list);
      } catch {
        setGatewayCandidates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, identity]);

  // Auto-load de credenciales del keyring al cambiar gateway (con timeout).
  useEffect(() => {
    if (!isOpen) return;
    if (!canManageCreds) {
      setCreds(null);
      setLoadingCreds(false);
      return;
    }
    let cancelled = false;
    const seq = (credsLoadSeq.current += 1);
    setLoadingCreds(true);
    void (async () => {
      try {
        const load = networkAdapter.getGatewayCredentials(gatewayIp);
        const current = await Promise.race([
          load,
          new Promise<GatewayCredentialsDTO | null>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500)),
        ]);
        if (cancelled) return;
        if (seq !== credsLoadSeq.current) return;
        setCreds(current);
        if (!gatewayFormDirty) {
          setUserInternal(current?.user ?? "");
          setPassInternal(current?.pass ?? "");
        }
      } catch (e) {
        if (cancelled) return;
        if (seq !== credsLoadSeq.current) return;
        if (e instanceof Error && e.message === "timeout") {
          setStatus({ kind: "load_timeout" });
        } else {
          setStatus({ kind: "load_error", error: String(e) });
        }
      } finally {
        if (!cancelled && seq === credsLoadSeq.current) setLoadingCreds(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, canManageCreds, gatewayIp, gatewayFormDirty]);

  const applyPresetToForm = useCallback((nextUser: string, nextPass: string) => {
    setUserInternal(nextUser);
    setPassInternal(nextPass);
    setGatewayFormDirty(true);
  }, []);

  const setUser = useCallback((v: string) => {
    setUserInternal(v);
    setGatewayFormDirty(true);
  }, []);

  const setPass = useCallback((v: string) => {
    setPassInternal(v);
    setGatewayFormDirty(true);
  }, []);

  const toggleShowPass = useCallback(() => setShowPass((v) => !v), []);

  const toggleGatewaySelected = useCallback((ip: string, nextChecked: boolean) => {
    setSelectedGateways((prev) => {
      const next = new Set(prev);
      nextChecked ? next.add(ip) : next.delete(ip);
      return next;
    });
  }, []);

  const clearSelectedGateways = useCallback(() => setSelectedGateways(new Set()), []);

  const saveCreds = useCallback(async () => {
    if (!canManageCreds) return;
    setStatus({ kind: "idle" });
    try {
      // Invalida cualquier auto-load in-flight para que no pise el resultado de esta operacion.
      credsLoadSeq.current += 1;
      await networkAdapter.saveGatewayCredentials(gatewayIp, user.trim(), pass);
      const current = await networkAdapter.getGatewayCredentials(gatewayIp);
      setCreds(current);
      if (!current) {
        setStatus({ kind: "save_not_verified" });
      } else {
        setStatus({ kind: "saved" });
        // UX: al guardar creds del gateway, persistimos tambien como preset del gateway (sin otro boton).
        await presets.actions.add(user.trim(), pass);
        await presets.actions.load(gatewayIp);
      }
      setGatewayFormDirty(false);
    } catch (e) {
      setStatus({ kind: "save_error", error: String(e) });
    }
  }, [canManageCreds, gatewayIp, user, pass, presets.actions]);

  const deleteCreds = useCallback(async () => {
    if (!canManageCreds) return;
    setStatus({ kind: "idle" });
    try {
      // Invalida cualquier auto-load in-flight para que no repinte credenciales despues del borrado.
      credsLoadSeq.current += 1;
      await networkAdapter.deleteGatewayCredentials(gatewayIp);
      const after = await networkAdapter.getGatewayCredentials(gatewayIp);
      setCreds(after);
      if (after) {
        setStatus({ kind: "delete_not_verified" });
      } else {
        setUserInternal("");
        setPassInternal("");
        setStatus({ kind: "deleted" });
      }
      setGatewayFormDirty(false);
    } catch (e) {
      setStatus({ kind: "delete_error", error: String(e) });
    }
  }, [canManageCreds, gatewayIp]);

  const deleteSelectedGateways = useCallback(async () => {
    if (selectedGateways.size === 0) return;
    setStatus({ kind: "idle" });
    try {
      credsLoadSeq.current += 1;
      const ips = Array.from(selectedGateways).map((ip) => ip.trim());
      await Promise.all(ips.map((ip) => networkAdapter.deleteGatewayCredentials(ip)));
      if (activeGateway && selectedGateways.has(activeGateway)) {
        setCreds(null);
        setUserInternal("");
        setPassInternal("");
      }
      setSelectedGateways(new Set());
      setStatus({ kind: "deleted" });
    } catch (e) {
      setStatus({ kind: "delete_error", error: String(e) });
    }
  }, [selectedGateways, activeGateway]);

  const state: GatewayCredsVaultState = {
    gatewayIpInput,
    gatewayIp,
    canManageCreds,
    loadingCreds,
    creds,
    user,
    pass,
    showPass,
    status,
    gatewayCandidates,
    selectedGateways,
    activeGateway,
    showBatchTargets,
    gatewayFormDirty,
  };

  const actions: GatewayCredsVaultActions = {
    setGatewayIpInput,
    setActiveGateway,
    activateGateway,
    setShowBatchTargets,
    toggleGatewaySelected,
    clearSelectedGateways,
    setUser,
    setPass,
    toggleShowPass,
    setStatus,
    saveCreds,
    deleteCreds,
    deleteSelectedGateways,
    resetOnOpen,
    applyPresetToForm,
    presets,
  };

  return { state, actions };
};
