// src/ui/features/settings/components/field_manual/LegendNodeCard.tsx
// Descripcion: tarjeta de nodo para la leyenda. Renderiza preview 3D + descripcion al lado (scroll-friendly).

import { HUD_COLORS, HUD_TYPO } from "../../../../styles/hudTokens";
import { LegendNodePreview3D } from "./LegendNodePreview3D";
import { useEffect, useMemo, useRef, useState } from "react";

export function LegendNodeCard({
  title,
  subtitle,
  color,
  details,
  isSelected,
  nodeKind,
  // Por defecto NO animamos todos los previews: demasiados Canvas animados degrada FPS y el scroll en WebView2.
  // Se anima bajo demanda (hover/focus) o en demos explicitos.
  animatePreview = false,
}: {
  title: string;
  subtitle: string;
  color: string;
  details: string[];
  isSelected: boolean;
  nodeKind: "router" | "host" | "intruder" | "wifi" | "default" | "jammed" | "selected_demo";
  animatePreview?: boolean;
}) {
  const border = isSelected ? "rgba(0,229,255,0.45)" : "rgba(0,255,136,0.14)";
  const [ready, setReady] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isWheelScrolling, setIsWheelScrolling] = useState(false);
  const wheelTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Si hay re-render por idioma/resize, reiniciamos loader solo en cards pesadas.
    setReady(false);
  }, [title, subtitle, color, nodeKind]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        setInView(Boolean(e.isIntersecting));
      },
      // Pre-carga antes de entrar en pantalla para que no parezca "vacio".
      { root: null, rootMargin: "320px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shouldAnimate = useMemo(() => Boolean(inView && !isWheelScrolling && (animatePreview || isActive)), [animatePreview, inView, isActive, isWheelScrolling]);

  return (
    <div
      ref={cardRef}
      style={{
        width: "100%",
        textAlign: "left",
        border: `1px solid ${border}`,
        background: isSelected ? "rgba(0,229,255,0.06)" : "rgba(0,0,0,0.35)",
        borderRadius: 2,
        padding: 10,
        display: "grid",
        gridTemplateColumns: "132px 1fr",
        gap: 12,
        cursor: "default",
        color: HUD_COLORS.textMain,
      }}
      aria-label={`LEGEND_NODE_CARD_${nodeKind}`}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocusCapture={() => setIsActive(true)}
      onBlurCapture={() => setIsActive(false)}
      onWheelCapture={() => {
        // Al hacer scroll, pausamos cualquier animacion para evitar microcortes.
        setIsWheelScrolling(true);
        if (wheelTimerRef.current) window.clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = window.setTimeout(() => setIsWheelScrolling(false), 140);
      }}
    >
      <div style={{ position: "relative" }}>
        {inView ? (
          <LegendNodePreview3D
            title={title}
            color={color}
            isIntruder={nodeKind === "intruder"}
            isJammed={nodeKind === "jammed"}
            isSelected={isSelected}
            animate={shouldAnimate}
            onReady={() => {
              // Pequeno delay para evitar parpadeo si el frame llega muy rapido.
              setTimeout(() => setReady(true), 40);
            }}
          />
        ) : (
          // Placeholder liviano: evita crear WebGL contexts para cards lejos del viewport.
          <div
            style={{
              width: 132,
              height: 120,
              border: "1px solid rgba(0,255,136,0.10)",
              background: "radial-gradient(circle at 50% 40%, rgba(0,255,136,0.08), rgba(0,0,0,0.92) 65%)",
              borderRadius: 2,
              boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.04)",
              flexShrink: 0,
            }}
            aria-label={`LEGEND_NODE_PLACEHOLDER_${nodeKind}`}
          />
        )}
        {!ready && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.25))",
              borderRadius: 2,
              pointerEvents: "none",
            }}
            aria-label={`LEGEND_NODE_LOADING_${nodeKind}`}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "2px solid rgba(0,255,136,0.22)",
                borderTopColor: "rgba(0,229,255,0.75)",
                boxShadow: "0 0 14px rgba(0,229,255,0.15)",
                animation: "nsSpin 0.9s linear infinite",
              }}
            />
          </div>
        )}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              fontFamily: HUD_TYPO.mono,
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: 1.0,
              textTransform: "uppercase",
              color: HUD_COLORS.textMain,
            }}
          >
            {title}
          </div>
          <div style={{ fontFamily: HUD_TYPO.mono, fontSize: 10, fontWeight: 900, letterSpacing: 0.7, color, opacity: 0.95 }}>
            {(nodeKind === "selected_demo" ? "SELECTED" : nodeKind.toUpperCase())}
          </div>
        </div>

        <div style={{ fontFamily: HUD_TYPO.mono, fontSize: 11, color: "rgba(183,255,226,0.78)", lineHeight: 1.45, marginTop: 4 }}>
          {subtitle}
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {details.map((line) => (
            <div
              key={line}
              style={{
                fontFamily: HUD_TYPO.mono,
                fontSize: 11,
                color: "rgba(183,255,226,0.72)",
                lineHeight: 1.45,
                wordBreak: "break-word",
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
