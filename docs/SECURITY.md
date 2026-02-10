# Politica de Seguridad de NetSentinel 3D

## 1. Alcance y Objetivo
Este documento define la postura de seguridad actual del proyecto y las reglas minimas para desarrollo, pruebas y release.

NetSentinel 3D es una herramienta defensiva de auditoria de red. Su uso debe estar limitado a:
- redes propias,
- redes con autorizacion explicita,
- entornos de laboratorio o formacion.

## 2. Modelo de Seguridad Base
### 2.1 Separacion de privilegios
- Frontend (React): no debe ejecutar operaciones de sistema ni red de bajo nivel.
- Backend (Rust + Tauri): concentra la logica sensible y expone comandos concretos.

### 2.2 Superficie IPC expuesta
Comandos actualmente registrados:
- `scan_network`
- `audit_target`
- `audit_router`
- `fetch_router_devices`
- `save_scan`
- `get_history`
- `get_identity`
- `start_traffic_sniffing`
- `stop_traffic_sniffing`
- `start_jamming`
- `stop_jamming`

Riesgo:
- Si la UI se compromete, un atacante puede intentar abusar de estos comandos.

Control:
- Mantener contratos estrictos, validaciones de entrada y minimizar comandos expuestos.

## 3. Configuracion Tauri y Hardening
### 3.1 Capabilities
En `src-tauri/capabilities/default.json` solo se declaran:
- `core:default`
- `opener:default`

Esto reduce permisos generales del runtime, pero no sustituye la validacion de comandos propios.

### 3.2 CSP
En `src-tauri/tauri.conf.json` la configuracion actual es:
- `app.security.csp` definida con directivas explicitas.
- `app.security.devCsp` definida para entorno de desarrollo local.

Estado actual:
- Produccion:
  - `default-src 'self' customprotocol: asset:`
  - `script-src 'self'`
  - `connect-src ipc: http://ipc.localhost`
  - `img-src 'self' asset: http://asset.localhost blob: data:`
  - `style-src 'self' 'unsafe-inline'`
  - `font-src 'self' data:`
  - `object-src 'none'`
  - `base-uri 'none'`
  - `form-action 'none'`
  - `frame-ancestors 'none'`
- Desarrollo:
  - Se permite `localhost:1420` y `ws://localhost:1420` para Vite/Tauri dev.

Impacto:
- Reduce superficie de XSS e inyeccion al bloquear origenes no autorizados por defecto.
- Mantiene compatibilidad con estilos inline actuales de la UI.

Siguiente mejora recomendada:
- Eliminar gradualmente `'unsafe-inline'` en `style-src` migrando estilos inline a hojas CSS controladas.

## 4. Riesgos por Modulo
### 4.1 Escaneo y auditoria (`scan_network`, `audit_target`, `audit_router`)
Riesgos:
- uso no autorizado sobre terceros,
- timeouts/agresividad mal ajustados generando impacto en red.

Controles recomendados:
- limitar concurrencia por defecto,
- registrar acciones de auditoria,
- mostrar advertencias de uso autorizado en UI.

### 4.2 Sniffing (`start_traffic_sniffing`)
Riesgos:
- captura accidental de trafico sensible,
- retencion excesiva de datos en memoria/UI.

Controles existentes:
- inicio/parada explicitos por comando,
- buffer acotado en frontend.

Controles recomendados:
- añadir filtros por interfaz/objetivo,
- ocultar datos sensibles en logs por defecto.

### 4.3 Jamming (`start_jamming`, `stop_jamming`)
Riesgos:
- modulo de mayor impacto operativo (interferencia activa),
- potencial degradacion de servicio en red local.

Controles recomendados:
- doble confirmacion en UI antes de activar,
- registro auditable de inicio/parada por objetivo,
- modo simulacion por defecto en entornos no-lab.

### 4.4 Persistencia (`save_scan`, `get_history`)
Riesgos:
- exposicion de inventario de red local en disco.

Controles existentes:
- uso de ruta de datos de usuario (no ruta relativa del proyecto).

Controles recomendados:
- documentar ubicacion exacta por SO,
- definir politica de retencion y borrado manual.

## 5. Cadena de Suministro (Dependencias)
Controles recomendados en CI o rutina semanal:
- `npm audit` para dependencias frontend.
- `cargo audit` para crates Rust.
- revisar changelogs de Tauri y crates de red (`pnet`, etc.).

Estado actual conocido:
- vulnerabilidades criticas/bloqueantes: no detectadas en `npm audit --omit=dev`.
- vulnerabilidades criticas/bloqueantes en Rust: mitigada la de `idna` al actualizar `reqwest` a `0.12`.
- advertencias no bloqueantes de Rust: dependencias GTK3 transitivas de Tauri en Linux marcadas como "unmaintained"; no aplican al target principal Windows, pero deben revisarse al planificar soporte Linux.

## 6. Reglas de Desarrollo Seguro
- No añadir comandos Tauri nuevos sin justificar riesgo/beneficio.
- Validar y sanear inputs en todos los comandos expuestos.
- Evitar logs con credenciales, tokens o datos sensibles.
- Mantener DTOs Rust/TS coherentes para evitar errores de parseo y bypass de validacion.
- Mantener comentarios y documentacion en castellano tecnico y accionable.

Validaciones backend actualmente aplicadas:
- IPv4 en comandos de auditoria y jamming (`audit_target`, `audit_router`, `fetch_router_devices`, `start_jamming`, `stop_jamming`).
- Rechazo de IPs no usables operativamente en objetivos y gateway (loopback, multicast, broadcast y `0.0.0.0`).
- Rango de escaneo en formato IPv4 o CIDR valido (`scan_network`).
- Credenciales no vacias y con longitud acotada en `fetch_router_devices`.
- Formato de MAC address validado en `start_jamming`.

## 7. Checklist Minimo Antes de Release
- [ ] `npm test -- --run` en verde.
- [ ] `npm run build` en verde.
- [ ] `cargo check` en verde.
- [ ] Revisión de comandos expuestos vs documentacion.
- [ ] Revisión de riesgos activos (sniffing/jamming) y mensajes de advertencia en UI.
- [ ] Auditoria basica de dependencias (`npm audit`, `cargo audit` cuando aplique).
- [ ] Verificacion de configuracion CSP para produccion.

## 8. Incidentes y Respuesta
Si se detecta comportamiento inseguro:
1. Desactivar temporalmente el comando o modulo afectado.
2. Registrar fecha, entorno y evidencia minima del fallo.
3. Crear fix con test o validacion reproducible.
4. Actualizar `docs/SECURITY.md`, `AGENTS.md` y docs afectadas en el mismo cambio.
