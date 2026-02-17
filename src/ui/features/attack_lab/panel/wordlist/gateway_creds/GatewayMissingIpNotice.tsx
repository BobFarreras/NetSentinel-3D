// src/ui/features/attack_lab/panel/wordlist/gateway_creds/GatewayMissingIpNotice.tsx
// Aviso cuando no hay gateway IP seleccionada (bloquea acciones de guardado/borrado).

import React from "react";

export const GatewayMissingIpNotice: React.FC<{ text: string }> = ({ text }) => {
  return (
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
      {text}
    </div>
  );
};

