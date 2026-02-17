<!-- Ruta: src-tauri/src/infrastructure/system_scanner/README.md -->
<!-- Descripcion: scanner local del host. Descubre interfaces/red, enriquece contexto (incl. identidad del host) y calcula puertos/datos para el resto del sistema. -->

# System Scanner (Infrastructure)

Modulo tecnico para obtener informacion del sistema local (host): discovery de red y enrichment de datos que alimentan escaneo/auditoria.

## Interconexiones

Entradas:
- `HostIdentityPort` (dominio) para obtener identidad del host sin acoplar a `local_intelligence`.

Salidas:
- Datos usados por application (scan/audit) y comandos de API como `get_identity` o `scan_network` (segun integracion).

Archivos:
- `discover.rs`: discovery de interfaces/host.
- `enrich.rs`: enrichment de dispositivos/datos (sin dependencias directas a `local_intelligence`).
- `ports.rs`: helpers sobre puertos/servicios (no confundir con domain ports).
- `sort.rs`: ordenaciones/utilidades de presentacion.

