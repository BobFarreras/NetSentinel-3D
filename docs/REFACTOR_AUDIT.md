<!-- docs/REFACTOR_AUDIT.md -->

# Auditoria de Mantenibilidad y Refactor (SOLID) - NetSentinel 3D

Documento operativo para detectar deuda tecnica, codigo repetido y archivos tipo “god file”, y convertirlo en un backlog de refactor **sin romper funcionalidad**.

Estado: **auditoria inicial** (no aplica cambios automaticamente).

---

## 1) Alcance y reglas del repositorio

Reglas (ver `AGENTS.md`):
- Arquitectura hexagonal pragmatica: `domain` / `application` / `infrastructure` / `presentation`.
- Los cambios deben ser pequenos y verificables.

Reglas adicionales solicitadas:
1. Todos los comentarios y nueva documentacion: **castellano tecnico**.
2. Todos los archivos del proyecto: **cabecera de ruta en la primera linea** (ver seccion 5).

---

## 2) Foto actual del repo (metricas rapidas)

Fuentes escaneadas: `src/`, `src-tauri/src/`, `docs/`.

Top archivos por tamaño (lineas):
- `src/ui/components/hud/RadarPanel.tsx` (~664)  **GOD UI**
- `src-tauri/src/infrastructure/wifi/wifi_scanner.rs` (~463)  **GOD infra**
- `src/ui/components/hud/ExternalAuditPanel.tsx` (~364)  **UI grande**
- `src-tauri/src/infrastructure/chrome_auditor.rs` (~301)  **infra multi-responsabilidad**
- `src-tauri/src/application/external_audit_service.rs` (~295)  **servicio grande**
- `src/App.tsx` (~294)  **shell UI**

Duplicaciones detectadas (ejemplos):
- Validacion/normalizacion: `isValidMac`, `isBadVendor` repetidos en hooks.
- Claves de `localStorage` dispersas (no centralizadas).

Lenguaje:
- Hay comentarios/logs en catalan en varios Rust/TS (ej: “Lògica”, “Càrrega”, “Hem”, etc.).

---

## 3) Riesgos de deuda tecnica (lo que mas puede romper)

1. **God files** (UI e infra) => baja escalabilidad, dificiles de testear y modificar sin regresiones.
2. **Helpers duplicados** => comportamiento inconsistente (un hook valida MAC de forma distinta a otro).
3. **Parsing fragil en infra** (netsh/router DOM) => cambios de firmware/idioma rompen flujos.
4. **Politica de comentarios/headers no automatizada** => deriva inevitable con el tiempo.

---

## 4) Backlog de refactor recomendado (prioridad por impacto)

### P0 - Separar responsabilidades en `chrome_auditor.rs` (SOLID)
**Problema**
`src-tauri/src/infrastructure/chrome_auditor.rs` mezcla:
- inyecciones JS (scripts),
- driver de navegador (launch/navigate),
- brute force credenciales,
- scraping/parseo DOM,
- enriquecimiento ARP + vendor,
- logging y configuracion (headless/visible).

**Refactor propuesto**
Crear un modulo dedicado a auditoria web del router:
`src-tauri/src/infrastructure/router_audit/`
- `mod.rs`
- `scripts.rs`:
  - `fn injection_login(...)`, `fn injection_click_submit()`, `fn extract_text()`
- `browser_driver.rs`:
  - `launch(headless)`, `navigate_and_wait(...)`
  - (opcional) trait `BrowserDriverPort` para tests
- `dom_parser.rs` (puro, testeable):
  - `fn parse_router_text(text: &str) -> Vec<ParsedDevice>`
  - tests unitarios con fixtures (capturas reales anonimizadas)
- `enrichment.rs`:
  - `fn enrich_with_arp(devices: &mut [Device])`
  - `fn resolve_vendor(devices: &mut [Device])`
- `chrome_auditor.rs` (fino):
  - orquesta los componentes y solo implementa `RouterAuditorPort`.

**Criterios de aceptacion**
- `cargo check` OK.
- Tests: parseo DOM cubierto con al menos 2 fixtures.
- Logs y DTOs no cambian (o se documentan en `docs/CHANGELOG.md`).

---

### P0 - Dividir `wifi_scanner.rs` en modulos por SO + parser testeable
Archivo actual: `src-tauri/src/infrastructure/wifi/wifi_scanner.rs`

**Problema**
Muy largo y con parsing complejo (locales, fallbacks, interfaces), dificil de mantener.

**Refactor propuesto**
`src-tauri/src/infrastructure/wifi/`
- `wifi_scanner.rs` (orquestacion + trait `WifiScannerPort`)
- `windows_netsh.rs`:
  - ejecucion `netsh ...`
  - parseo `show interfaces`
  - parseo `show networks mode=bssid`
- `normalize.rs`:
  - sanitizacion SSID
  - `riskLevel` / `isTargetable`
  - calculo `distanceMock`
- `fixtures/` + tests:
  - outputs reales (ES/EN) recortados y anonimizados
  - objetivo: fijar contratos de parsing. Si Windows/driver/idioma cambia el formato del texto,
    los tests fallan y nos avisan antes de romper el producto.

**Criterios de aceptacion**
- Parser con tests unitarios por idioma/variante.
- El comando `scan_airwaves` mantiene contrato (`WifiNetworkDTO`).

---

### P0 - Trocear `RadarPanel.tsx` (UI) en componentes y hooks
Archivo actual: `src/ui/components/hud/RadarPanel.tsx`

**Problema**
UI monolitica: filtros, layout, legal modal, auto-refresh, lista, detalles, etc.

**Refactor propuesto**
Crear carpeta:
`src/ui/components/hud/radar/`
- `RadarPanel.tsx` (composicion)
- `RadarHeader.tsx` (titulo, botones scan/auto/close)
- `RadarFilters.tsx` (Node Intel: risk/band/ch/search)
- `RadarNetworksTable.tsx` (tabla/lista + seleccion)
- `RadarDetails.tsx` (panel derecho, “Node Intel” seleccionado)
- `RadarLegalModal.tsx` (aviso legal)

Y mover logica a hooks:
- `src/ui/hooks/modules/radar/useWifiRadar.ts` (ya existe): mantener como “fuente de datos”.
- `useRadarFilters.ts` (nuevo): filtros puros (testeables).

**Criterios de aceptacion**
- `npm test -- --run` OK.
- `npm run build` OK.
- UI igual o mejor, sin regresiones de filtros/auto-refresh.

---

### P1 - Centralizar helpers de dispositivos (evitar duplicacion)
**Problema**
Validacion/merge de `mac/vendor/name` repetido en:
- `src/ui/hooks/modules/network/useScanner.ts`
- `src/ui/hooks/modules/network/useRouterHacker.ts`

**Refactor propuesto**
Crear util puro:
`src/core/logic/deviceMerge.ts`
- `isValidMac(mac?: string): boolean`
- `isBadVendor(vendor?: string): boolean`
- `mergeDeviceIntel(old: DeviceDTO, next: DeviceDTO): DeviceDTO`
- `mergeInventory(prev: DeviceDTO[], scan: DeviceDTO[]): DeviceDTO[]`

Y reemplazar duplicaciones.

**Criterios de aceptacion**
- Tests unitarios nuevos para `mergeInventory`.
- Hooks mas pequenos.

---

### P1 - Centralizar claves de `localStorage`
**Problema**
Claves dispersas y con nombres distintos:
- `netsentinel:autoScanOnStartup`
- `netsentinel.showNodeLabels`
- `netsentinel.radar.legalAccepted`

**Refactor propuesto**
Crear:
`src/ui/constants/storageKeys.ts`
```ts
export const STORAGE_KEYS = {
  autoScanOnStartup: "netsentinel:autoScanOnStartup",
  showNodeLabels: "netsentinel.showNodeLabels",
  radarLegalAccepted: "netsentinel.radar.legalAccepted",
} as const;
```
Y reemplazar usos.

---

### P2 - Normalizar idioma: comentarios y logs en castellano
**Problema**
Hay comentarios/logs en catalan (y mezcla) en Rust/TS.

**Estrategia recomendada**
- No intentar “traducir todo el repo” en un solo PR.
- Regla operativa: **archivo tocado => comentarios en castellano + cabecera de ruta**.
- Crear una issue “Language debt” y cerrarla por paquetes (backend, frontend, docs).

**Archivos a revisar primero**
- `src-tauri/src/infrastructure/chrome_auditor.rs`
- `src-tauri/src/application/*.rs` (logs `println!`)
- `src/ui/hooks/useNetworkManager.ts`
- Tests (comentarios y `describe/it`).

---

### P2 - Cabecera de ruta en primera linea (estandar)
**Problema**
La mayoria de archivos no tienen cabecera de ruta; solo hay unos pocos.

**Estandar propuesto**
- TS/TSX/JS/JSX:
  - primera linea: `// src/ui/.../File.tsx`
- Rust:
  - primera linea: `// src-tauri/src/.../file.rs`
- Markdown:
  - primera linea: `<!-- docs/FILE.md -->`

**Automatizacion (recomendada)**
- Crear un script de verificacion en CI (Node o PowerShell) que falle si:
  - el archivo no tiene cabecera,
  - o la cabecera no coincide con su ruta.

**Implementacion incremental**
- Fase 1: aplicar cabecera solo en archivos modificados por PR.
- Fase 2: aplicar por carpetas (por ejemplo `src-tauri/src/infrastructure/**`).

---

## 5) Checklist SOLID (para revisar PRs)

- S (Single Responsibility): un archivo no deberia mezclar UI + parsing + IO + heuristicas.
- O (Open/Closed): parsers y drivers deben extenderse con nuevos casos sin reescribir todo.
- L (Liskov): traits/ports deben ser intercambiables (mocks para tests).
- I (Interface Segregation): preferir traits pequenos (ej: `WifiScannerPort`, `RouterAuditorPort`).
- D (Dependency Inversion): `application` depende de `ports`, no de detalles de `netsh`/Chrome.

---

## 6) Comandos utiles para la auditoria (rapidos)

### 6.1 Ver “god files” por lineas
```powershell
rg --files src src-tauri/src docs | % { $_ } | % { [pscustomobject]@{ file=$_; lines=(Get-Content $_ | Measure-Object -Line).Lines } } |
  Sort-Object lines -Descending | Select-Object -First 25
```

### 6.2 Buscar catalan (indicativo)
```powershell
rg -n \"Càrrega|Lògica|Hem |Afegim|Iniciant|Finalitzat|Obrint\" src src-tauri/src
```

### 6.3 Buscar duplicaciones tipicas
```powershell
rg -n \"isValidMac\\(|isBadVendor\\(\" src
```

---

## 7) Siguiente paso recomendado

1. Refactor P0: `chrome_auditor.rs` en modulos + tests de parser.
2. Refactor P0: `wifi_scanner.rs` parser con fixtures ES/EN.
3. Refactor P0: `RadarPanel.tsx` en subcomponentes + hook de filtros.

Cada paso en PR separado, con validaciones:
- `npm test -- --run`
- `npm run build`
- `cd src-tauri && cargo check`
