<!-- Ruta: src-tauri/src/domain/README.md -->
<!-- Descripcion: capa de dominio. Contiene entidades puras, puertos (traits) y reglas sin dependencias de Tauri/IO. -->

# Domain (Rust)

La capa de dominio define:

- Entidades (modelos) del problema.
- Puertos (traits) que la aplicacion usa para depender de abstracciones.
- Reglas/validadores puros (sin IO).

## Interconexiones

Consumidores:
- `src-tauri/src/application/*`: depende de `domain` (entities + ports).

Implementadores:
- `src-tauri/src/infrastructure/*`: implementa ports con red/FS/OS.
- `src-tauri/src/api/*`: implementa puertos de presentacion (ej: sinks para eventos Tauri).

Archivos clave:
- `entities.rs`: tipos de dominio (incluye Attack Lab + host identity).
- `ports.rs`: contratos (traits) para inyeccion de dependencias.

