// src/ui/features/scene3d/components/node_label/nodeLabelStyles.ts
// CSS embebido del NodeLabel (animaciones y type-in) parametrizado por glow para mantener el look cyberpunk.

export const getNodeLabelCssText = (glow: string) => `
  @keyframes nsLabelGlow {
    0% { box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 18px ${glow}; }
    50% { box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 28px ${glow}; }
    100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.55), 0 0 18px ${glow}; }
  }
  @keyframes nsLabelScan {
    0% { transform: translateY(0); opacity: 0.10; }
    50% { transform: translateY(10px); opacity: 0.22; }
    100% { transform: translateY(0); opacity: 0.10; }
  }
  @keyframes nsSelectedPulse {
    0% { transform: translateY(-14px) scale(1.18); }
    50% { transform: translateY(-14px) scale(1.26); }
    100% { transform: translateY(-14px) scale(1.18); }
  }
  @keyframes nsTypeIn {
    0% { clip-path: inset(0 100% 0 0); opacity: 0.75; }
    100% { clip-path: inset(0 0 0 0); opacity: 1; }
  }
  @keyframes nsFlicker {
    0%, 100% { filter: none; }
    50% { filter: brightness(1.08) contrast(1.05); }
  }
  .nsType1 { animation: nsTypeIn 0.85s steps(18, end) forwards; }
  .nsType2 { animation: nsTypeIn 0.95s steps(22, end) forwards; animation-delay: 0.10s; }
  .nsType3 { animation: nsTypeIn 1.05s steps(26, end) forwards; animation-delay: 0.18s; }
`;

