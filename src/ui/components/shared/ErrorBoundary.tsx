// src/ui/components/shared/ErrorBoundary.tsx
// ErrorBoundary reutilizable: evita que un fallo en un sub-arbol de UI tumbe toda la app, mostrando un fallback controlado.

import React from "react";

type ErrorBoundaryProps = {
  label: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log minimo y accionable: la UI no debe quedar en blanco.
    // eslint-disable-next-line no-console
    console.error(`[ErrorBoundary:${this.props.label}]`, error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      this.props.fallback ?? (
        <div
          style={{
            border: "1px solid rgba(255,85,85,0.45)",
            background: "rgba(255,85,85,0.08)",
            color: "#ff6677",
            padding: 12,
            fontFamily: "'Consolas', monospace",
            fontSize: 12,
            lineHeight: 1.4,
          }}
          role="alert"
          aria-label={`ERROR_BOUNDARY_${this.props.label}`}
        >
          <div style={{ fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>UI Error</div>
          <div style={{ opacity: 0.9, marginTop: 6 }}>
            {error.name}: {error.message}
          </div>
        </div>
      )
    );
  }
}

