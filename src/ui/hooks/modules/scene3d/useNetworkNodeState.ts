// src/ui/hooks/modules/scene3d/useNetworkNodeState.ts
import { useEffect, useMemo, useState } from "react";
import { uiLogger } from "../../../utils/logger";

type UseNetworkNodeStateArgs = {
  isSelected: boolean;
  color: string;
  name: string;
  onClick?: () => void;
};

type UseNetworkNodeState = {
  hovered: boolean;
  speed: number;
  scale: number;
  nodeColor: string;
  emissiveColor: string;
  emissiveIntensity: number;
  handleClick: (e: { stopPropagation: () => void }) => void;
  handlePointerOver: () => void;
  handlePointerOut: () => void;
};

export const useNetworkNodeState = ({ isSelected, color, name, onClick }: UseNetworkNodeStateArgs): UseNetworkNodeState => {
  const [hovered, setHovered] = useState(false);

  const debug3d = useMemo(() => {
    if (!import.meta.env.DEV) return false;
    try {
      return localStorage.getItem("netsentinel.debug3d") === "true";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const speed = useMemo(() => (isSelected ? 2 : 0.5), [isSelected]);
  const scale = useMemo(() => (isSelected ? 1.5 : hovered ? 1.2 : 1), [hovered, isSelected]);
  const nodeColor = useMemo(() => (isSelected ? "#ffd700" : hovered ? "#ffffff" : color), [color, hovered, isSelected]);
  const emissiveColor = useMemo(() => (isSelected ? "#ffd700" : color), [color, isSelected]);
  const emissiveIntensity = useMemo(() => (isSelected ? 2 : 0.5), [isSelected]);

  const handleClick = (e: { stopPropagation: () => void }) => {
    if (debug3d) {
      uiLogger.info(`Click 3D detectado en ${name}`);
    }
    e.stopPropagation();
    onClick?.();
  };

  const handlePointerOver = () => {
    if (debug3d) {
      uiLogger.info(`Cursor sobre nodo ${name}`);
    }
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return {
    hovered,
    speed,
    scale,
    nodeColor,
    emissiveColor,
    emissiveIntensity,
    handleClick,
    handlePointerOver,
    handlePointerOut,
  };
};
