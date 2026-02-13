<!-- docs/BACKEND_REFACTOR_GUIDE.md -->
<!-- Descripcion: guia paso a paso para reestructurar el backend (Rust/Tauri) sin un "big bang", manteniendo contratos y builds verdes. -->

# Guia de reestructura del backend (Rust/Tauri) por fases

Objetivo: hacer el backend mas legible y mantenible sin romper contratos Rust <-> TypeScript ni cambiar el comportamiento en runtime.

Reglas del juego:
- Cambios pequenos y atomicos (una skill/caso de uso por PR/commit).
- Siempre mantener verde: `cargo check` (y cuando sea posible `cargo test`) + `npm test -- --run` + `npm run build`.
- No romper comandos Tauri ya usados por UI (se puede reestructurar internamente manteniendo el nombre del comando).

## Fase 0: Baseline y mapa (sin mover codigo)
1. Confirmar comandos Tauri actuales (fuente de verdad).
   - Archivo: `src-tauri/src/api/commands.rs`
   - Lista en doc: `AGENTS.md` (mantener sincronizado).
2. Confirmar contratos DTO.
   - Rust: `src-tauri/src/api/dtos.rs`
   - TS: `src/shared/dtos/NetworkDTOs.ts`
3. Identificar por skill donde vive cada caso de uso.
   - `application/*_service.rs` (casos de uso)
   - `domain/*` (puertos/entidades)
   - `infrastructure/*` (implementaciones tecnicas)

Deliverable:
- Un diagrama simple en `docs/ARCHITECTURE.md` (si hace falta) con el flujo UI -> command -> application -> infra -> domain.

## Fase 1: Estructura de `application/` por dominios (sin cambiar APIs)
Problema actual: `src-tauri/src/application` esta plano y cuesta navegar.

Objetivo: agrupar por dominio/skill manteniendo paths publicos estables temporalmente via `pub use`.

Propuesta de carpetas:
```text
src-tauri/src/application
  attack_lab/
  audit/
  credentials/
  history/
  jammer/
  opsec/
  scan/
  settings/
  snapshot/
  traffic/
  wifi/
  wordlist/
  mod.rs
```

Plan incremental (recomendado):
1. Crear los modulos (carpetas + `mod.rs`) vacios.
2. Migrar 1 servicio por paso:
   - mover `scanner_service.rs` -> `scan/service.rs`
   - actualizar `application/mod.rs` para reexportar el API anterior:
     - `pub use scan::service::ScannerService;` o mantener `pub mod scanner_service;` como wrapper fino.
3. Repetir con `audit_service`, `traffic_service`, etc.

Regla practica:
- Durante la migracion, mantener archivos wrapper `*_service.rs` que solo deleguen al nuevo modulo.
- Cuando todo el codigo consumidor ya use el nuevo path, eliminar wrappers.

Nota (estado actual del repo):
- No se mantienen wrappers legacy en `application/legacy/*` (el repo ya esta migrado por completo).

Checklist por cada servicio migrado:
- [ ] `src-tauri/src/lib.rs` compila sin cambios funcionales.
- [ ] `src-tauri/src/api/commands/*.rs` sigue invocando el mismo caso de uso (aunque cambie el modulo interno).
- [ ] Tests existentes siguen pasando.
- [ ] `docs/CHANGELOG.md` actualizado (entrada corta).

## Fase 2: Consolidar Attack Lab y compatibilidad legacy (external_audit)
Estado actual (repo):
- `attack_lab` es el nombre oficial interno.
- Los shims legacy `external_audit` ya fueron eliminados (backend + frontend).

Acciones recomendadas (sin romper comandos existentes):
1. Mantener comandos Tauri estables:
   - `start_attack_lab` / `cancel_attack_lab`
2. Asegurar que el streaming de eventos (`attack-lab-log` / `attack-lab-exit`) es consistente.

Regla:
- No reintroducir aliases `start_external_audit/cancel_external_audit` salvo plan explicito de compatibilidad (y documentado).

## Fase 3: Dominio e infraestructura (hexagonal real)
Objetivo: que `application/` dependa de puertos del dominio, no de implementaciones concretas.

Pasos:
1. Definir/clarificar puertos en `src-tauri/src/domain/ports.rs`.
2. Extraer dependencias de infraestructura detras de traits:
   - ejemplo: `TrafficSnifferPort`, `WifiScannerPort`, `CredentialStorePort`, etc.
3. `application/*` recibe dependencias por constructor (DI) en vez de instanciar infra adentro.
4. `lib.rs` compone (wiring) las implementaciones reales.

Orden recomendado (por riesgo):
1. Storage/snapshot/credentials (bajo riesgo, facil de testear).
2. Scanner/audit ports.
3. Traffic/jammer (mas sensible por runtime/privilegios).
4. Attack Lab runner (exec externo, timeouts, streaming).

## Fase 4: Tests y contratos
1. Añadir tests unitarios de puertos (domain) y casos de uso (application) con dobles (mocks/fakes).
2. Congelar contratos:
   - si cambian DTOs, actualizar Rust + TS en el mismo PR.
3. Añadir una seccion en `docs/TESTING.md` para backend:
   - `cargo check`
   - `cargo test` (cuando sea posible en Windows)

## Definition of Done (backend)
- [ ] `cd src-tauri && cargo check` verde
- [ ] `npm test -- --run` verde
- [ ] `npm run build` verde
- [ ] No hay comandos Tauri rotos / sin documentar
- [ ] `docs/ARCHITECTURE.md` + `docs/CHANGELOG.md` actualizados
