<!-- docs/FRONTEND_IMPROVEMENT_PROTOCOL.md -->
<!-- Descripcion: protocolo y guia por fases para mejorar UI (docking/detached, Attack Lab, Scene3D, layout y settings) sin romper contratos ni tests. -->

# Protocolo de mejoras UI (Frontend) - NetSentinel 3D

Objetivo: implementar mejoras grandes paso a paso, con riesgo controlado, manteniendo SOLID y el flujo estable.

## Reglas (no negociables)

1. Cambios pequenos y verificables (1 problema principal por tanda).
2. Mantener contratos y nombres de comandos/eventos Tauri.
3. Cada cambio debe incluir:
   - test actualizado o nuevo cuando sea posible
   - evidencia de validaciones minimas
4. Comentarios/documentacion en castellano tecnico.

Validaciones minimas (al final de cada fase):

```bash
npm test -- --run
npm run build
cd src-tauri
cargo check
```

## Fases (backlog por prioridad)

### Fase 1 (P0): Docking/detached fiable (cierre de ventana => redock)

Problema:
- Al cerrar una ventana desacoplada (boton X), el panel no vuelve a la ventana principal.

Solucion:
- En runtime detached, capturar cierre nativo de Tauri (`close-requested`) y emitir `netsentinel://dock-panel`.
- Mantener fallback web: `pagehide` + `beforeunload`.

Definition of Done:
- Cerrar ventana desacoplada vuelve a mostrar el panel en modo dock en la ventana principal.
- Tests de `useDetachedRuntime` cubren `beforeunload` y registro de listener.

### Fase 2 (P0): Attack Lab no debe disparar CyberConfirmModal al “hide”

Objetivo:
- `CyberConfirmModal` solo se muestra cuando el usuario ejecuta (start), no al ocultar/cerrar UI.

Acciones:
- Revisar `TopBar.tsx` y eventos/handlers relacionados.
- Renombrar accion de UI: `HideLab` -> `CloseLab` o `ToggleLab` segun comportamiento real.

### Fase 3 (P0): Detached Attack Lab no debe perder contexto

Objetivo:
- Al desacoplar Attack Lab, debe conservar:
  - `targetDevice`
  - `defaultScenarioId`
  - `autoRun` (cuando aplica)

Acciones:
- Asegurar que el contexto se pasa por URL params y/o evento `netsentinel://attack-lab-context`.
- Definir fuente de verdad de contexto (una sola).

### Fase 4 (P0): MAC spoofing no debe duplicar nodos “verdes”

Objetivo:
- Si cambia la identidad del host, el nodo viejo no debe competir visualmente.

Opciones:
- A) marcar nodo viejo como `stale` (gris + no seleccionable)
- B) colapsar/eliminar nodo viejo al detectar que es el mismo host (reconciliacion por gatewayIp + interfaceName)

### Fase 5 (P1): Settings/Help (idioma + glosario HUD)

Objetivo:
- Panel de Settings para:
  - idioma (i18n basico)
  - glosario: que significa cada color/nodo/riesgo
  - enlaces a docs internas (ARCHITECTURE, SECURITY, RADAR_VIEW)

### Fase 6 (P1): TopBar layout y ergonomia

Objetivo:
- Mejorar densidad sin perder legibilidad:
  - selectors/menus
  - TopBar full-width
  - `DeviceDetailPanel` adaptado debajo

### Fase 7 (P2): Borde/Frame visual y barra custom (opcional)

Objetivo:
- Definir borde consistente del viewport (especialmente abajo).
- Evaluar barra superior custom (tipo VSCode/Cursor) solo si el target Tauri lo permite sin romper UX.

