// src/ui/features/attack_lab/catalog/scenarios/_shared/platform.ts
// Helpers del catalogo: deteccion de plataforma para decidir soporte de presets.

export const isWindows = (): boolean => navigator.userAgent.toLowerCase().includes("windows");

