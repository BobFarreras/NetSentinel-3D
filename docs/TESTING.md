<!-- docs/TESTING.md -->
<!-- Descripcion: guia de tests, comandos de validacion y ubicacion recomendada de suites por feature/modulo. -->

# Guia de Testing de NetSentinel 3D

## 1. Objetivo
Definir una estrategia de testing clara para:
- desarrolladores junior,
- colaboradores nuevos,
- agentes IA que implementan cambios de codigo.

La meta es reducir regresiones y asegurar que frontend, contratos y backend evolucionen de forma controlada.

## 2. Estado Actual del Testing
### 2.1 Stack de pruebas
- Runner: Vitest
- Entorno: `jsdom`
- Utilidades de React: `@testing-library/react`
- Setup global: `src/test/setup.ts`

### 2.2 Tests existentes
Frontend (unit):
- `src/core/logic/intruderDetection.test.ts`
- `src/core/logic/deviceIntel.test.ts`
- `src/adapters/__tests__/networkAdapter.test.ts`
- `src/adapters/__tests__/auditAdapter.test.ts`
- `src/adapters/__tests__/wifiAdapter.test.ts`
- `src/ui/hooks/__tests__/useNetworkManager.test.ts`
- `src/ui/hooks/modules/__tests__/useScanner.test.ts`
- `src/ui/hooks/modules/__tests__/useRouterHaker.test.ts`
- `src/ui/features/radar/__tests__/useWifiRadar.test.ts`
- `src/ui/features/traffic/__tests__/useTrafficMonitor.test.ts`
- `src/ui/features/radar/__tests__/useRadarLogs.test.ts`
- `src/ui/features/console_logs/__tests__/useConsoleLogsState.test.ts`
- `src/ui/features/traffic/__tests__/useTrafficPanelState.test.ts`
- `src/ui/features/device_detail/__tests__/useDeviceDetailPanelState.test.ts`
- `src/ui/features/scene3d/__tests__/useNetworkSceneState.test.ts`
- `src/ui/features/scene3d/__tests__/useNetworkNodeState.test.ts`
- `src/ui/features/scene3d/__tests__/useNodeLabelState.test.ts`
- `src/ui/hooks/modules/network/useBootstrapNetwork.ts` (cubierto de forma indirecta por `useNetworkManager` y tests de scanner/adapters)
- `src/ui/features/console_logs/__tests__/ConsoleLogs.test.tsx`
- `src/ui/features/traffic/__tests__/TrafficPanel.test.tsx`
- `src/ui/features/wordlist/__tests__/useWordlistManager.test.ts`
- `src/ui/features/device_detail/__tests__/DeviceDetailPanel.test.tsx`
- `src/ui/features/attack_lab/__tests__/AttackLabPanel.test.tsx`
- `src/ui/features/radar/__tests__/RadarPanel.test.tsx`
- `src/__tests__/App.integration.test.tsx`

E2E:
- `e2e/app.spec.ts`

Cobertura actual:
- logica pura (deteccion de intrusos),
- hooks de orquestacion con mocks de adapters.

Gap actual:
- la cobertura ha mejorado (adapters + paneles principales), pero sigue siendo recomendable:
  - añadir tests de regresion cuando se toquen contratos DTO o comandos Tauri,
  - añadir mas tests puros de merge/enriquecimiento de inventario,
  - mantener E2E centrado en flujos clave (sin backend nativo en CI).

## 3. Comandos de Verificacion
Desde la raiz del proyecto:

```bash
npm test -- --run
npm run build
npm run test:e2e
```

Chequeo rapido de deuda tecnica frontend:
```bash
rg -n "\\bany\\b|console\\." src/ui src/adapters --glob "!**/__tests__/**"
```

Backend Rust:

```bash
cd src-tauri
cargo check
cargo test
```

Nota de entorno Windows:
- `cargo test` puede fallar por linking de `Packet.lib`.
- Si ocurre, registrar el error y usar `cargo check` como validacion minima mientras se resuelve la dependencia nativa.

## 4. Estrategia por Capas
## 4.1 Logica pura (`src/core/logic`)
Objetivo:
- validar reglas de negocio sin dependencias de React ni Tauri.

Reglas:
- tests deterministicos,
- sin mocks complejos,
- datos de entrada y salida simples.

## 4.2 Hooks (`src/ui/hooks`)
Objetivo:
- validar orquestacion de estado, llamadas a adapters y efectos.

Reglas:
- mockear adapters (`networkAdapter`, `auditAdapter`),
- envolver actualizaciones async en `act(...)`,
- usar `waitFor(...)` cuando la asercion dependa de efectos.

## 4.3 Adapters (`src/adapters`)
Objetivo:
- asegurar contrato de parametros hacia `invoke(...)`.

Reglas:
- mockear `@tauri-apps/api/core`,
- comprobar nombre de comando y payload exacto,
- comprobar parseo de respuesta minima.

## 4.4 Componentes UI criticos
Objetivo:
- validar renderizado condicional y callbacks criticos.

Prioridad inicial:
- `TrafficPanel.tsx`
- `DeviceDetailPanel.tsx`
- `NetworkScene.tsx`

## 4.5 Backend Rust (`src-tauri/src/application`)
Objetivo:
- cubrir casos de uso con mocks de puertos/infrastructura.

Reglas:
- priorizar tests unitarios en `application` y `domain`,
- evitar depender de red real o drivers del sistema,
- aislar comportamiento de riesgo/calculo/transformacion.

Notas:
- Cuando un modulo depende de salidas del sistema (por ejemplo PowerShell o `netsh`), preferir tests con fixtures y parsers puros.

## 4.6 E2E UI (`e2e/`)
Objetivo:
- validar flujos reales de interfaz en navegador con Playwright.

Estado actual:
- Configuracion en `playwright.config.ts`.
- Modo mock de Tauri para E2E:
  - `VITE_E2E_MOCK_TAURI=true` en `playwright.config.ts`.
  - Bridge unificado: `src/shared/tauri/bridge.ts`.
- Flujos E2E en `e2e/app.spec.ts`:
  - carga de interfaz principal,
  - escaneo y actualizacion de nodos,
  - carga de snapshot desde historial,
  - inicio de monitor de trafico y recepcion de paquetes,
  - resiliencia ante error de `scan_network` sin romper UI,
  - resiliencia ante error de `start_traffic_sniffing` manteniendo estado detenido,
  - seleccion de nodo, auditoria de puertos y alerta critica de gateway,
  - apertura/cierre de historial.

Comandos:
```bash
npm run test:e2e
npm run test:e2e:ui
```

Reglas E2E:
- Evitar depender de backend nativo para pruebas de UI en CI.
- Mantener todos los puntos `invoke/listen` pasando por el bridge compartido.
- Si se añade un nuevo comando/evento Tauri, actualizar el mock E2E en el mismo cambio.

## 10. CI en GitHub Actions
Workflow:
- `.github/workflows/ci.yml`

Checks automatizados:
- Frontend + E2E (Ubuntu):
  - `npm test -- --run`
  - `npm run build`
  - `npm run test:e2e`
  - `npm audit --omit=dev --audit-level=high` (no bloqueante)
- Rust (Windows):
  - `cargo check --tests`
  - `cargo test` (si el runner lo permite)
  - `cargo audit` (no bloqueante)

Nota:
- `cargo audit` puede reportar advertencias de dependencias transitivas de Tauri/GTK en Linux; mientras no sean vulnerabilidades bloqueantes del target soportado, el pipeline no debe romperse por ese motivo.

## 5. Criterios de Aceptacion por Cambio
Aplicar esta tabla antes de cerrar una tarea:

- Cambio solo visual:
  - `npm run build`
  - test del componente afectado o snapshot/assercciones de render

- Cambio en hook o adapter:
  - `npm test -- --run`
  - test nuevo o actualizado del hook/adapter
  - verificacion de contrato de comando IPC

- Cambio en DTOs o comandos Tauri:
  - `npm test -- --run`
  - `npm run build`
  - `cargo check`
  - actualizar tests de adapters/hook consumidores

- Cambio en servicios Rust:
  - `cargo check`
  - tests unitarios en modulo afectado (si el entorno lo permite)
  - validar impacto en DTOs y frontend

## 6. Convenciones para Escribir Tests
- Escribir descripcion del test en castellano tecnico y claro.
- Mantener estructura `Arrange -> Act -> Assert`.
- Un test debe validar un comportamiento principal.
- Evitar asserts ambiguos o demasiado genericos.
- Evitar dependencias temporales fragiles (`setTimeout`) si hay alternativas (`waitFor`).

## 7. Plantilla Recomendada (Hooks)
```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

describe('Hook X', () => {
  it('debe ejecutar el flujo esperado', async () => {
    // Arrange
    // mock adapters

    // Act
    await act(async () => {
      // trigger
    });

    // Assert
    expect(true).toBe(true);
  });
});
```

## 8. Roadmap de Mejora de Testing
Prioridad alta:
- tests de `networkAdapter` y `auditAdapter` (contratos IPC).
- tests de `useTrafficMonitor` (start/stop, buffers y filtrado).

Prioridad media:
- tests de `TrafficPanel` para filtros `ALL/JAMMED/TARGET`.
- tests de `useNetworkManager` (integracion de modulos).

Prioridad baja:
- ampliar unit tests Rust en `audit_service`, `history_service`, `traffic_service`.

Prioridad inmediata (Radar View):
- tests de `wifiAdapter` (contrato `scan_airwaves`).
- tests de `useWifiRadar` (estado, errores y normalizacion de datos).
- tests de render de `RadarView` (colores por riesgo y filtros por canal/banda).
- E2E de flujo Radar: abrir vista, escanear, seleccionar nodo y ver detalle.

## 9. Checklist Rapido para PR
- [ ] He añadido o actualizado tests del comportamiento modificado.
- [ ] `npm test -- --run` pasa en local.
- [ ] `npm run build` pasa en local.
- [ ] `cargo check` pasa en local (si hubo cambios en Rust).
- [ ] Si no pude ejecutar algo, lo he documentado explicitamente en la PR/tarea.
