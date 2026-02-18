<!-- src-tauri/src/application/audit/README.md -->
<!-- Descripcion: modulo Audit (backend). Auditoria de gateway/router y sync de inventario desde el router. -->

# Backend: Audit (Gateway / Router)

## Que hace (en 3 lineas)
- Ejecuta auditoria del gateway (brute-force controlado y veredicto).
- Si hay credenciales, extrae inventario de dispositivos conectados desde el router.
- Devuelve resultados como DTOs para que la UI actualice el inventario.

## Donde vive (rutas)
- Application: `src-tauri/src/application/audit/service.rs`
- Comandos Tauri: `src-tauri/src/api/commands/router_audit.rs`
- DTOs:
  - Rust: `src-tauri/src/api/dtos.rs` (`RouterAuditResultDTO`, `DeviceDTO`)
  - TS: `src/shared/dtos/NetworkDTOs.ts`

## Comandos Tauri (IPC)
- `audit_router(gateway_ip: string) -> RouterAuditResultDTO`
- `fetch_router_devices(gateway_ip: string, user: string, pass: string) -> DeviceDTO[]`
  - Nota: en application se formatea `creds` como `user:pass` (string) para el puerto.

## Puertos de dominio (dependencias)
- `RouterAuditorPort` (`src-tauri/src/domain/ports.rs`)
  - `audit_gateway(ip) -> RouterAuditResult`
  - `fetch_connected_devices(ip, creds) -> Device[]`

## Infraestructura usada (I/O real)
- Implementacion del auditor de router:
  - `src-tauri/src/infrastructure/router_audit/chrome_auditor.rs`
- Parsing y enrichment (helpers/fixtures):
  - `src-tauri/src/infrastructure/router_audit/dom_parser.rs`
  - `src-tauri/src/infrastructure/router_audit/enrichment.rs`
  - `src-tauri/src/infrastructure/router_audit/fixtures/*`

## Flujo (receta)
1. UI llama `audit_router`.
2. `router_audit.rs` valida `gateway_ip` y llama a `AuditService.brute_force_gateway`.
3. El puerto `RouterAuditorPort` ejecuta la auditoria y devuelve `RouterAuditResult`.
4. UI decide: si hay credenciales, llama `fetch_router_devices` para sync.

## Tests
- `src-tauri/src/application/audit/service.rs` incluye tests con un `MockRouterAuditor` (valida delegacion y formato de credenciales).

