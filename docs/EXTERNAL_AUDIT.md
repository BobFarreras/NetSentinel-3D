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
- Servicio:
  - `src-tauri/src/application/external_audit_service.rs`
    - valida request,
    - crea `audit_id`,
    - ejecuta proceso (async) y emite eventos,
    - soporta cancelacion y timeout.
- Comandos Tauri:
  - `src-tauri/src/api/commands.rs`
    - `start_external_audit`
    - `cancel_external_audit`
- DTOs (contrato Rust):
  - `src-tauri/src/api/dtos.rs`

### Frontend (React/TS)
- Contratos TS (DTO espejo):
  - `src/shared/dtos/NetworkDTOs.ts`
- Adapter (IPC):
  - `src/adapters/externalAuditAdapter.ts`
- Hook de runtime (eventos/logs):
  - `src/ui/hooks/modules/useExternalAudit.ts`
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
En `src-tauri/src/application/external_audit_service.rs` se usa:
- `Command::new(binary_path)` + `cmd.args(args)`

No usamos `cmd /c ...` ni `sh -c ...` por defecto para evitar injection por concatenacion.

### 5.2 Validaciones defensivas
El backend valida (resumen):
- `binary_path` no vacio, sin byte nulo,
- limites de args (cantidad y longitud),
- limites de env,
- `timeoutMs` con rango (min/max).

### 5.3 Cancelacion
`cancel_external_audit` envia una senal interna; el runner hace `child.kill()` y espera el `wait()`.

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

