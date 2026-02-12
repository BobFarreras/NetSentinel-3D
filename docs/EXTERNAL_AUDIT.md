<!-- docs/EXTERNAL_AUDIT.md -->

# External Audit y LAB Audit (Guia Completa)

Esta guia documenta el modulo **EXTERNAL AUDIT** y su modo **LAB AUDIT** en NetSentinel 3D.

Objetivo: permitir a un administrador (o un laboratorio) **orquestar herramientas CLI existentes** y/o ejecutar **simulaciones didacticas** sin bloquear la UI y manteniendo una arquitectura hexagonal pragmatica.

Regla del proyecto (ver `docs/SECURITY.md`):
- NetSentinel no busca reimplementar herramientas ofensivas ni empaquetarlas.
- El modo `LAB` puede incluir **simulaciones** educativas y presets no intrusivos.
- El modo `CUSTOM` ejecuta lo que el administrador configure (ruta + args), con validaciones defensivas.

---

## 1) Conceptos: que es cada modo

### 1.1 EXTERNAL AUDIT (CUSTOM)
Permite ejecutar una herramienta externa instalada en el sistema:
- el usuario proporciona `binaryPath` y `args` (tokenizados),
- el backend ejecuta el proceso sin usar shell,
- se hace streaming de `stdout/stderr` en tiempo real hacia la UI,
- al finalizar se emite un evento de salida con `exitCode` y `success`.

### 1.2 LAB AUDIT (LAB)
Es un catalogo de escenarios para juniors/alumnos:
- `external`: presets que construyen un request automaticamente (por ejemplo PowerShell en Windows).
- `simulated`: no ejecuta procesos, solo imprime pasos (stdout/stderr) para explicar una tecnica o una defensa.

Ventaja: onboarding rapido y consistencia operacional.

---

## 2) Arquitectura y flujo de datos (end-to-end)

Flujo `CUSTOM` o `LAB(external)`:
1. UI construye un `ExternalAuditRequestDTO` (ruta + args + timeout opcional).
2. Adapter llama a Tauri `invoke("start_external_audit", { request })`.
3. Backend crea un `audit_id` y lanza el proceso con `tokio::process::Command`.
4. Backend emite eventos:
   - `external-audit-log` (linea a linea, `stdout`/`stderr`),
   - `external-audit-exit` (exit code + success + duracion).
5. Hook UI escucha eventos, filtra por `audit_id` y actualiza la consola del panel.

Flujo `LAB(simulated)`:
1. UI genera una lista de pasos con delays (SimStep).
2. Hook los imprime en consola con timers.
3. Se genera un "exit" simulado con `success=true`.

---

## 3) Mapa de archivos (fuente de verdad)

### Backend (Rust, Tauri)
- Servicio (fuente de verdad):
  - `src-tauri/src/application/external_audit/`
    - `service.rs`: API del caso de uso (`start_audit`, `cancel_audit`), genera `audit_id`.
    - `runner.rs`: ejecuta el proceso con `tokio::process::Command` y hace streaming stdout/stderr.
    - `sink.rs`: salida de eventos (Tauri sink) + sink de memoria (solo tests).
    - `validation.rs`: validaciones defensivas del request.
    - `types.rs`: modelos (`ExternalAuditRequest`, eventos, etc.).
    - `tests.rs`: tests reales (sin mocks) para stdout/stderr + timeout + cancel.
  - `src-tauri/src/application/external_audit_service.rs`
    - **shim de compatibilidad** (re-export) para no romper imports legacy.
- Comandos Tauri:
  - `src-tauri/src/api/commands.rs`
    - `start_external_audit`
    - `cancel_external_audit`
  - Implementacion interna:
    - `src-tauri/src/api/commands/external_audit.rs`
- DTOs (contrato Rust):
  - `src-tauri/src/api/dtos.rs`

### Frontend (React/TS)
- Contratos TS (DTO espejo):
  - `src/shared/dtos/NetworkDTOs.ts`
- Adapter (IPC):
  - `src/adapters/externalAuditAdapter.ts`
- Hook de runtime (eventos/logs):
  - `src/ui/hooks/modules/ui/useExternalAudit.ts`
- UI:
  - `src/ui/components/hud/ExternalAuditPanel.tsx`
- Catalogo de escenarios `LAB`:
  - `src/core/logic/externalAuditScenarios.ts`

---

## 4) Contrato (DTO) y eventos

### 4.1 Request (desde UI a Rust)
En TypeScript: `src/shared/dtos/NetworkDTOs.ts`

Campos:
- `binaryPath: string`
- `args: string[]` (cada arg es un token; no se concatenan strings tipo "cmd && cmd2" salvo que uses un interprete como `powershell.exe`)
- `cwd?: string`
- `timeoutMs?: number`
- `env?: { key: string; value: string }[]`

### 4.2 Eventos emitidos (Rust -> UI)
El backend emite:
- `external-audit-log`
  - `{ auditId, stream: "stdout"|"stderr", line }`
- `external-audit-exit`
  - `{ auditId, success, exitCode?, durationMs, error? }`

El hook `useExternalAudit` filtra por `auditId` para que no se mezclen auditorias.

---

## 5) Seguridad y decisiones DevSecOps (por que esta hecho asi)

### 5.1 No usar shell
En `src-tauri/src/application/external_audit/runner.rs` se usa:
- `Command::new(binary_path)` + `cmd.args(args)`

No usamos `cmd /c ...` ni `sh -c ...` por defecto para evitar injection por concatenacion.

### 5.2 Validaciones defensivas
El backend valida (ver `src-tauri/src/application/external_audit/validation.rs`):
- `binary_path` no vacio, sin byte nulo,
- limites de args (cantidad y longitud),
- limites de env,
- `timeoutMs` con rango (min/max).

### 5.3 Cancelacion
`cancel_external_audit` envia una senal interna; el runner hace `child.kill()` y espera el `wait()`.

Semantica actual:
- Cancelado: `success=false` y `error` contiene `"cancelado por el usuario"`.
- Timeout: `success=false` y `error` contiene `"timeout"`.

### 5.4 Streaming en tiempo real
Se leen pipes con `BufReader(lines())` y se emiten eventos por linea.
Esto permite mostrar progreso incremental en UI sin esperar al final.

---

## 6) Limitaciones conocidas

1. Portabilidad:
   - Los presets actuales en `LAB(external)` estan pensados para Windows (PowerShell).
   - En Linux/macOS: usar `CUSTOM` o anadir escenarios especificos del SO.
2. Herramientas externas:
   - NetSentinel no instala herramientas por si mismo.
   - Si el binario no existe o no tiene permisos, el backend devolvera error en `external-audit-exit`.
3. Output muy grande:
   - El hook limita el buffer de filas (`max 2000`) para evitar consumo de RAM.

---

## 7) Como anadir un nuevo escenario LAB (paso a paso)

Editar: `src/core/logic/externalAuditScenarios.ts`

### 7.1 Escenario SIMULADO (recomendado para formacion)
1. Anade un `id`, `title`, `description`, `mode: "simulated"`, `category`.
2. Implementa `simulate(ctx)` devolviendo una lista de pasos:

```ts
simulate: () => [
  { delayMs: 0, stream: "stdout", line: "Paso 1..." },
  { delayMs: 300, stream: "stderr", line: "Aviso..." },
]
```

### 7.2 Escenario EXTERNAL (wrapper real)
1. Define `mode: "external"`.
2. (Opcional) implementa `isSupported(ctx)` para bloquear el preset por SO:
   - Ejemplo: si no es Windows, devolver `{ supported:false, reason:"..." }`.
3. Implementa `buildRequest(ctx)` devolviendo `ExternalAuditRequestDTO`:

```ts
buildRequest: ({ device }) => ({
  binaryPath: "powershell.exe",
  args: ["-NoProfile", "-Command", `ping -n 2 ${device.ip}`],
  timeoutMs: 60000,
})
```

Nota: si quieres ejecutar varios comandos, hazlo dentro del interprete (PowerShell) o crea un script y ejecútalo como binario.

---

## 8) Como añadir un binario nuevo (CUSTOM) sin tocar codigo

En el panel `EXTERNAL AUDIT`:
1. Tab `CUSTOM`.
2. Rellenar:
   - `BINARIO (ruta)`: ruta absoluta del ejecutable.
   - `ARGUMENTOS`: 1 por linea (cada linea es un token).
   - `TIMEOUT`: opcional.
   - `CWD`: opcional.
3. Pulsar `RUN`.

Tip: si la herramienta requiere PATH, usa ruta absoluta o configura PATH del sistema.

---

## 9) Debug y troubleshooting

### 9.1 No salen logs
Comprobar:
- que el proceso realmente se ejecuta (si falla al spawn, se emitira `external-audit-exit` con `error`),
- que el hook esta montado (panel abierto),
- que el `auditId` coincide (el hook filtra por `auditId`).

### 9.2 Cancel no funciona
El cancel es cooperativo:
- se envia una senal interna y se hace `kill`.
- si el proceso ignora señales o termina muy rapido, el efecto puede ser "no visible" (pero no rompe estado).

---

## 10) Checklist de calidad (antes de merge)

- `npm test -- --run`
- `npm run build`
- `cd src-tauri && cargo check`

---

## 11) FAQ para juniors

### Por que hay dos modos (LAB y CUSTOM)?
- `LAB`: UX guiada, escenarios repetibles y didacticos.
- `CUSTOM`: potencia total para un administrador que ya sabe que herramienta quiere ejecutar.

### Por que LAB tiene escenarios simulados?
Porque la docencia no depende de ejecutar herramientas reales siempre:
- se puede ensenar el flujo, señales y mitigaciones,
- y reservar ejecuciones reales para un laboratorio controlado y autorizado.

---

## 12) Vinculo con `DOC-ATTACK.md` (catalogo tactico -> runtime)

`DOC-ATTACK.md` funciona como catalogo de tecnicas/familias.  
`EXTERNAL_AUDIT` es el motor de ejecucion real.

Regla de traduccion a codigo:
1. Tecnica del catalogo -> escenario en `src/core/logic/externalAuditScenarios.ts`.
2. Escenario:
   - `mode: "external"` si ejecuta herramienta instalada.
   - `mode: "simulated"` si es flujo educativo/inferencia.
3. El escenario se ejecuta desde `ExternalAuditPanel` y reporta por:
   - `external-audit-log`
   - `external-audit-exit`

No se implementan "ataques hardcodeados" dentro de componentes de UI:
- la UI solo selecciona target + plantilla,
- el backend solo orquesta ejecucion/cancelacion y streaming.

---

## 13) Flujo real actual: router seleccionado en Radar -> plantilla LAB

Flujo implementado en el estado actual del repo:
1. Seleccion de nodo en escena/radar (`NetworkScene` -> `selectedDevice`).
2. Apertura de `DeviceDetailPanel`.
3. Click en `LAB AUDIT`.
4. `App.tsx` abre `ExternalAuditPanel` con:
   - `targetDevice=<dispositivo seleccionado>`
   - `defaultScenarioId`:
     - gateway: `router_recon_ping_tracert`
     - no-gateway: `device_http_headers`
   - `autoRun=true` si viene con target + escenario.
5. `ExternalAuditPanel` resuelve escenario y ejecuta:
   - externo con `start_external_audit`, o
   - simulado con `startSimulated`.

Puntos exactos de codigo:
- `src/App.tsx`
- `src/ui/components/hud/DeviceDetailPanel.tsx`
- `src/ui/components/hud/ExternalAuditPanel.tsx`
- `src/core/logic/externalAuditScenarios.ts`
- `src/ui/hooks/modules/ui/useExternalAudit.ts`

Si quieres "plantillas de ataques por router" mas amplias:
- Anade escenarios categoria `ROUTER` en `externalAuditScenarios.ts`.
- Define `isSupported` + `buildRequest` (o `simulate`) por cada plantilla.
- Mantiene `DOC-ATTACK.md` como referencia funcional y actualiza `docs/CHANGELOG.md`.

---

## 14) Que significa exactamente tu ejemplo de salida

Caso reportado:
- Escenario: `HTTP: Fingerprint de cabeceras (HEAD)`
- Target: `192.168.1.139`
- Comando preview: `powershell.exe ... Invoke-WebRequest ... -Method Head ...`
- Resultado: `exit=1`, `ok=false`, error de conexion remota.

Interpretacion operativa:
1. Esto **no es simulado**. Es un escenario `mode: "external"` real.
2. NetSentinel lanza PowerShell real en tu sistema (proceso hijo).
3. PowerShell intenta hacer una peticion HTTP HEAD real a `http://192.168.1.139/`.
4. El host no responde por HTTP en ese puerto/ruta (o esta filtrado), por eso `Invoke-WebRequest` lanza excepcion.
5. El proceso termina con codigo de salida distinto de 0 (`exit=1`), y `external-audit-exit` marca `success=false`.

Traduccion de campos UI:
- `AUTO`: se ejecuto automaticamente al abrir panel con `target + defaultScenarioId`.
- `Finalizado: ... exit=1, ok=false`: la ejecucion termino, pero fallo el comando del escenario.
- `STDOUT START auditId=...`: inicio de auditoria.
- `STDERR ... No es posible conectar con el servidor remoto`: error real del comando ejecutado.

Que es "ROUTER" aqui:
- En este flujo, `router` significa **gateway detectado** de tu red local.
- Se identifica por `device.isGateway === true` o por coincidencia con `identity.gatewayIp`.
- Si el nodo seleccionado no es gateway, `App.tsx` asigna el escenario por defecto de `DEVICE` (`device_http_headers`).

---

## 15) Decision tecnica para el siguiente salto

Si quieres eliminar friccion de herramientas externas para alumnos:
- El camino es migrar de `ExternalAudit` (wrapper de CLI) a un motor **Native Audit** en Rust.
- El frontend seguiria parecido (selector de plantilla + logs), pero en backend ya no habria `binaryPath/args`.
- Ver guia de migracion: `docs/EXTERNAL_AUDIT_REFACTOR.md`.

---

## 16) External Audit desacoplado (ventana independiente)

Estado actual de UX:
1. `ExternalAuditPanel` puede ejecutarse acoplado o en ventana desacoplada.
2. En modo desacoplado Tauri, la ventana se abre como `WebviewWindow` nativa.
3. El cierre recomendado es el boton `X` nativo del SO.

Sincronizacion de contexto en caliente:
- Si el operador lanza `LAB AUDIT` desde `DeviceDetailPanel` y `External` ya esta desacoplado,
  la principal envia contexto al panel externo via evento:
  - `netsentinel://external-context`
  - payload: `targetDevice`, `scenarioId`, `autoRun`.
- Esto evita que el panel desacoplado quede sin target/escenario.

Reacople y cierre:
- Al cerrar la ventana desacoplada con `X`, se emite `netsentinel://dock-panel` en `pagehide`.
- La ventana principal reacopla el panel y limpia estado detached.
