// src/ui/components/layout/topbar/topbarIcons.tsx
// Iconos SVG del TopBar: helpers puros para mantener TopBar.tsx liviano sin cambiar el look.

const iconStroke = (color: string) => ({
  stroke: color,
  fill: "none",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const TopBarIcons = {
  history: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" {...iconStroke(color)} />
      <path d="M3 4v5h5" {...iconStroke(color)} />
      <path d="M12 7v6l4 2" {...iconStroke(color)} />
    </svg>
  ),
  radar: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12l7-7" {...iconStroke(color)} />
      <circle cx="12" cy="12" r="9" {...iconStroke(color)} />
      <path d="M12 3v3" {...iconStroke(color)} />
      <path d="M21 12h-3" {...iconStroke(color)} />
    </svg>
  ),
  lab: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 2v6l-5.5 9.5A4 4 0 0 0 8 22h8a4 4 0 0 0 3.5-4.5L14 8V2" {...iconStroke(color)} />
      <path d="M8 16h8" {...iconStroke(color)} />
    </svg>
  ),
  settings: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" {...iconStroke(color)} />
      <path
        d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.8a8 8 0 0 0-1.7-1l-.3-2.4H9.1l-.3 2.4a8 8 0 0 0-1.7 1l-2.3-.8-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.8c.5.4 1.1.7 1.7 1l.3 2.4h5.8l.3-2.4c.6-.3 1.2-.6 1.7-1l2.3.8 2-3.4-2-1.2z"
        {...iconStroke(color)}
      />
    </svg>
  ),
  scan: (color: string) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7V4h3" {...iconStroke(color)} />
      <path d="M20 7V4h-3" {...iconStroke(color)} />
      <path d="M4 17v3h3" {...iconStroke(color)} />
      <path d="M20 17v3h-3" {...iconStroke(color)} />
      <path d="M7 12h10" {...iconStroke(color)} />
    </svg>
  ),
};
