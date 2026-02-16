// src/ui/features/attack_lab/panel/wordlist/hooks/useGatewayCredentialPresets.ts
// Hook de presets gateway: CRUD de pares user/pass persistidos (JSON backend) para rellenar rapido credenciales de auditoria.

import { useCallback, useEffect, useMemo, useState } from "react";
import { networkAdapter } from "../../../../../../adapters/networkAdapter";
import type { GatewayCredentialPresetDTO } from "../../../../../../shared/dtos/NetworkDTOs";

const keyOf = (p: GatewayCredentialPresetDTO) => `${p.gatewayIp}\n${p.user}\n${p.pass}`;

export const useGatewayCredentialPresets = (isOpen: boolean, gatewayIp: string | null) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GatewayCredentialPresetDTO[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [lastActionInfo, setLastActionInfo] = useState<{ type: "delete"; count: number } | { type: "idle" }>({ type: "idle" });

  const load = useCallback(async (gatewayIp: string) => {
    setLoading(true);
    try {
      const list = await networkAdapter.listGatewayCredentialPresets(gatewayIp);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!gatewayIp) {
      setItems([]);
      setSelected(new Set());
      setEditingKey(null);
      return;
    }
    setSelected(new Set());
    setEditingKey(null);
    void load(gatewayIp);
  }, [isOpen, gatewayIp, load]);

  const add = useCallback(async (user: string, pass: string) => {
    if (!gatewayIp) return;
    const list = await networkAdapter.addGatewayCredentialPreset(gatewayIp, user, pass);
    setItems(list);
  }, [gatewayIp]);

  const remove = useCallback(async (preset: GatewayCredentialPresetDTO) => {
    const list = await networkAdapter.removeGatewayCredentialPreset(preset.gatewayIp, preset.user, preset.pass);
    setItems(list);
  }, []);

  const update = useCallback(async (oldPreset: GatewayCredentialPresetDTO, newPreset: GatewayCredentialPresetDTO) => {
    const list = await networkAdapter.updateGatewayCredentialPreset(
      oldPreset.gatewayIp,
      oldPreset.user,
      oldPreset.pass,
      newPreset.user,
      newPreset.pass
    );
    setItems(list);
  }, []);

  const toggle = useCallback((preset: GatewayCredentialPresetDTO) => {
    const k = keyOf(preset);
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => setSelected(new Set()), []);

  const removeSelected = useCallback(async () => {
    const bucket = new Set(selected);
    if (bucket.size === 0) return;
    const toDelete = items.filter((p) => bucket.has(keyOf(p)));
    for (const p of toDelete) {
      // Secuencial: evita saturar IPC y simplifica manejo de errores.
      // Si se quiere optimizar, convertir a Promise.all.
      // eslint-disable-next-line no-await-in-loop
      await networkAdapter.removeGatewayCredentialPreset(p.gatewayIp, p.user, p.pass);
    }
    if (gatewayIp) {
      await load(gatewayIp);
    }
    setSelected(new Set());
    setLastActionInfo({ type: "delete", count: toDelete.length });
  }, [gatewayIp, items, load, selected]);

  const editingPreset = useMemo(() => {
    if (!editingKey) return null;
    const found = items.find((p) => keyOf(p) === editingKey);
    return found ?? null;
  }, [editingKey, items]);

  return {
    state: { loading, items, selected, editingKey, editingPreset, lastActionInfo },
    actions: { load, add, remove, update, toggle, deselectAll, removeSelected, setEditingKey },
  };
};
