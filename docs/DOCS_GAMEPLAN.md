<!-- docs/DOCS_GAMEPLAN.md -->
<!-- Descripcion: plan incremental para enlazar documentacion y README por features, sin big-bang. Escribido simple (nivel junior/niño) pero profesional. -->

# Guia Para Ordenar La Documentacion (Sin Hacerlo Todo De Golpe)

Objetivo: que **un junior** (y tu yo-del-futuro) pueda responder en 30 segundos:
- "¿Donde está esto?"
- "¿Que comando lo ejecuta?"
- "¿Que DTO viaja?"
- "¿Que archivo tengo que tocar?"

Regla de oro:
1. Primero hacemos un **mapa**, luego enlazamos **README por feature**, y al final pulimos textos.
2. Un cambio de codigo que cambie flujo/contratos/comandos debe actualizar docs **en el mismo commit**.

---

## Fase 0 (1 dia): Fuente de verdad y lista corta

Entregable:
- Un lugar donde mirar para saber "que existe".

Checklist:
1. Asegurar que estos archivos estan correctos:
   - `AGENTS.md` (lista de comandos Tauri)
   - `docs/SECURITY.md` (superficie IPC)
   - `docs/ARCHITECTURE.md` (mapa de comandos y capas)
2. Crear/actualizar `docs/README.md` como indice (1 pagina).

Regla:
- Si un comando aparece en `src-tauri/src/lib.rs` pero no aparece en `AGENTS.md`, hay deuda.

---

## Fase 1 (1-2 dias): Mapa de flujo (con dibujito mental)

Entregable:
- Un "camino" simple que siempre funciona.

Plantilla de flujo (ponerlo en cada README de feature):
1. UI (panel) llama a un hook.
2. El hook llama a un adapter (`src/adapters/*`).
3. El adapter hace `invokeCommand("...")`.
4. Rust recibe el comando en `src-tauri/src/api/commands/<feature>.rs`.
5. El comando delega a un servicio en `src-tauri/src/application/<feature>/`.
6. Infraestructura (si aplica) vive en `src-tauri/src/infrastructure/<...>/`.
7. Rust responde DTO o emite eventos.
8. UI muestra logs/resultado.

Nota para niños:
- UI = "pantalla".
- Adapter = "telefonito" que llama al backend.
- Command = "puerta" del backend.
- Service = "cerebro" (reglas).
- Infra = "musculo" (sistema/red/disco).

---

## Fase 2 (2-4 dias): README por feature (solo lo imprescindible)

Entregable:
- Cada carpeta `src/ui/features/<feature>/README.md` contesta lo basico.

Checklist por feature:
1. "Que hace" en 3 lineas.
2. "Que NO hace" en 2 lineas (limites).
3. "Interconexiones":
   - comandos Tauri
   - eventos Tauri (si hay)
   - DTOs compartidos
   - entrypoints UI (panel/hook)
4. "Flujo" de 5-8 pasos (como receta).
5. "Tests": donde estan.

Orden recomendado (por valor):
1. `attack_lab`
2. `radar`
3. `traffic`
4. `device_detail`
5. `history`
6. `settings`
7. `scene3d`
8. `console_logs`
9. `wordlist`

Regla:
- No escribas novela. README es un mapa, no un libro.

---

## Fase 3 (1-2 dias): Index de comandos y contratos

Entregable:
- Un doc que haga de "tabla de contenidos" para comandos.

Acciones:
1. En `docs/ARCHITECTURE.md` mantener la lista completa de comandos.
2. En `src-tauri/src/api/commands/README.md` mantener el mapa por archivo:
   - `http_fingerprint.rs` -> `fingerprint_http_headers`
   - `attack_lab.rs` -> `start_attack_lab`, `cancel_attack_lab`
   - etc.
3. Congelar contratos:
   - Rust: `src-tauri/src/api/dtos.rs`
   - TS: `src/shared/dtos/NetworkDTOs.ts`

---

## Fase 4 (continuo): Guardrails para no romper docs

Entregable:
- Que docs no se queden viejos.

Reglas operativas:
1. Si cambias un comando:
   - actualiza `src/adapters/*`
   - actualiza `AGENTS.md`
   - actualiza `docs/SECURITY.md`
   - actualiza `docs/ARCHITECTURE.md`
2. Si cambias un DTO:
   - actualiza Rust + TS en el mismo cambio
   - anade 1 test (aunque sea minimo)
3. Si cambias un flujo UI:
   - actualiza el README de la feature (solo el apartado "Flujo")

---

## Definition of Done (Docs)

- [ ] Existe `docs/README.md` como indice.
- [ ] Cada feature importante tiene `README.md`.
- [ ] `AGENTS.md`, `docs/SECURITY.md` y `docs/ARCHITECTURE.md` coinciden con `src-tauri/src/lib.rs`.
- [ ] Tests/build/check verdes:
  - `npm test -- --run`
  - `npm run build`
  - `cd src-tauri && cargo check`

