# Guia de refactor: de Attack Lab (antes: ExternalAudit, CLI wrapper) a NativeAudit (Rust nativo)

Objetivo de esta guia:
- eliminar dependencia de herramientas externas en LAB,
- mantener ejecucion real (sin mocks/simulaciones),
- conservar arquitectura hexagonal y trazabilidad por eventos.

Importante:
- esta guia se centra en auditoria tecnica y validacion de superficie/riesgo.
- no define automatizacion de intrusion, fuerza bruta ni explotacion activa.

---

## 1) Problema actual

Estado actual (`ExternalAudit`):
- `LAB` mezcla escenarios `external` y `simulated`.
- `external` depende de binarios/CLI del host (PowerShell, etc.).
- experiencia variable por SO y por entorno del alumno.

Impacto:
- friccion de onboarding.
- errores por entorno (path/permisos/ausencia de servicio objetivo).
- semantica de salida buena, pero fuente de ejecucion heterogenea.

---

## 2) Target de arquitectura

Nuevo modulo: `NativeAuditSkill` (backend Rust nativo).

Principio:
- la UI elige una plantilla.
- backend ejecuta un pipeline nativo Rust con probes/modulos internos.
- salida en streaming por eventos, igual que ahora.

Capas:
1. Dominio:
   - plantilla de auditoria (`AuditTemplate`),
   - pasos (`AuditStep`),
   - hallazgos (`AuditFinding`, severidad, evidencia).
2. Aplicacion:
   - orquestador `NativeAuditService` con `start/cancel`.
3. Infraestructura:
   - probes nativos (HTTP, TCP, DNS, ARP metadata, TLS metadata).
4. API:
   - comandos Tauri y DTOs espejo TS.

---

## 3) Contratos nuevos (propuesta)

Rust DTO/API:
- `start_native_audit(request: NativeAuditRequestDTO) -> audit_id`
- `cancel_native_audit(audit_id)`

Eventos:
- `native-audit-log`
- `native-audit-finding`
- `native-audit-exit`

TypeScript DTO espejo:
- `NativeAuditRequestDTO`:
  - `targetIp`
  - `templateId`
  - `options` (timeouts, puertos max, profundidad)

Compatibilidad:
- mantener `ExternalAudit` una version de transicion.
- panel UI puede soportar ambos motores con feature flag.

---

## 4) Plantillas nativas iniciales (sin CLI externa)

Primera ola recomendada:
1. `router_surface_baseline`
   - conectividad, puertos base, banners seguros/inseguros, headers admin.
2. `device_http_fingerprint`
   - status line, headers, auth challenges, TLS metadata si aplica.
3. `iot_exposure_baseline`
   - puertos comunes IoT, servicios detectados, riesgo por combinacion.
4. `gateway_config_hardening_check`
   - chequeos de higiene configuracional observables (sin exploit).

Formato salida:
- cada plantilla produce hallazgos tipados y accionables.
- logs tecnicos linea a linea para la consola.

---

## 5) Plan de migracion por fases

## Fase 0 - Documentacion y contratos
1. actualizar `docs/ARCHITECTURE.md` con nuevo modulo `native_audit/*`.
2. actualizar `AGENTS.md` con regla:
   - plantillas de LAB deben priorizar motor nativo.
3. mantener `docs/ATTACK_LAB.md` como legado/transicion.
4. añadir decision record en changelog.

Entregable:
- documentos alineados antes de tocar codigo.

## Fase 1 - Backend minimo funcional
1. crear `src-tauri/src/application/native_audit/`:
   - `service.rs`, `runner.rs`, `types.rs`, `sink.rs`, `validation.rs`.
2. implementar `template registry` nativo en Rust (no en frontend).
3. crear comandos Tauri:
   - `start_native_audit`
   - `cancel_native_audit`
4. emitir eventos equivalentes a external audit.

Entregable:
- ejecutar una plantilla nativa simple end-to-end desde comando.

## Fase 2 - Frontend bridge dual
1. crear `src/adapters/nativeAuditAdapter.ts`.
2. crear hook `src/ui/hooks/modules/ui/useNativeAudit.ts`.
3. extender `AttackLabPanel` o crear `NativeAuditPanel`:
   - selector de plantilla nativa,
   - logs/hallazgos/exit.
4. en `LAB AUDIT`, enrutar target a plantilla nativa por defecto.

Entregable:
- click en nodo -> LAB -> run nativo sin `binaryPath`.

## Fase 3 - Sustitucion progresiva de escenarios
1. mover escenarios de `externalAuditScenarios.ts` a un mapeo de `templateId`.
2. retirar `simulated` en flujos principales.
3. dejar `CUSTOM external` solo como modo experto temporal.

Entregable:
- LAB totalmente nativo y real (sin simulacion).

## Fase 4 - Retirada de legacy
1. (Ya realizado) eliminar `start_external_audit/cancel_external_audit` y mantener solo `start_attack_lab/cancel_attack_lab`.
2. mantenerlos solo para modo avanzado o eliminar en release posterior.
3. limpiar docs, tests y adapters obsoletos.

Entregable:
- arquitectura consolidada sin dependencia obligatoria de CLI externas.

---

## 6) Cambios por archivo (checklist)

Backend:
- `src-tauri/src/api/commands.rs`
- `src-tauri/src/api/dtos.rs`
- `src-tauri/src/api/commands/native_audit.rs` (nuevo)
- `src-tauri/src/application/native_audit/*` (nuevo)
- `src-tauri/src/lib.rs` (registro de comandos/estado)

Frontend:
- `src/shared/dtos/NetworkDTOs.ts`
- `src/adapters/nativeAuditAdapter.ts` (nuevo)
- `src/ui/hooks/modules/ui/useNativeAudit.ts` (nuevo)
- `src/ui/features/attack_lab/panel/AttackLabPanel.tsx` o `NativeAuditPanel.tsx`
- `src/App.tsx` (routing de apertura por target)

Docs:
- `docs/ARCHITECTURE.md`
- `docs/ATTACK_LAB.md`
- `AGENTS.md`
- `docs/CHANGELOG.md`

---

## 7) Testing minimo obligatorio

Frontend:
- tests del nuevo hook `useNativeAudit`.
- test de panel LAB con auto-run y template por target.

Backend:
- tests de `validation` y `runner` por plantilla.
- tests de cancelacion/timeout/eventos.

Pipeline:
- `npm test -- --run`
- `npm run build`
- `cd src-tauri && cargo check`

---

## 8) Roadmap recomendado (orden de ejecucion)

1. contratos + eventos `native-audit-*`.
2. una plantilla nativa `device_http_fingerprint`.
3. integracion UI LAB con esa plantilla.
4. migrar plantilla gateway por defecto.
5. desactivar `simulated` en LAB principal.
6. documentar resultados y cerrar changelog.
