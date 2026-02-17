<!-- Ruta: src-tauri/src/infrastructure/persistence/README.md -->
<!-- Descripcion: adaptadores de persistencia. Implementan puertos de repositorio/almacenamiento usando filesystem/DB/local OS APIs. -->

# Persistence (Infrastructure)

Implementaciones concretas para almacenamiento local: historial, snapshots, settings, credenciales y repositorios auxiliares.

## Interconexiones

Consumidores:
- Casos de uso en `src-tauri/src/application/*` que requieren persistencia.
- API commands que exponen operaciones de storage al frontend.

Relaciones:
- Puertos de dominio viven en `src-tauri/src/domain/ports.rs` (si aplica para cada repo/store).
- DTOs y comandos se mantienen en `src-tauri/src/api/*`.

Archivos:
- `history_repository.rs`: sesiones guardadas (history).
- `latest_snapshot_repository.rs`: snapshot rapido para arranque.
- `settings_store.rs`: settings persistidos.
- `credential_store.rs`: credenciales del gateway (keyring/OS).
- `wordlist_repository.rs`: diccionario/wordlist local.

