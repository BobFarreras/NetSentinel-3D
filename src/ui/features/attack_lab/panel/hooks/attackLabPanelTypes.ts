// src/ui/features/attack_lab/panel/hooks/attackLabPanelTypes.ts
// Tipos compartidos del AttackLabPanel (evita imports circulares entre hooks de estado).

export type AttackLabPanelMode = "LAB" | "CUSTOM";

export type AttackLabPanelNextStep = {
  id: string;
  title: string;
  disabled: boolean;
  onRun: () => void;
};

