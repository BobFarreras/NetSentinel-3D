<!-- Ruta: src/ui/features/wordlist/README.md -->
<!-- Descripcion: feature Wordlist. Hook reutilizable para cargar/gestionar wordlists desde backend y exponer acciones para UI (Attack Lab, futuras auditorias). -->

# Wordlist (UI)

Feature transversal para gestionar wordlists (carga, estado de loading y acciones). Se consume actualmente desde Attack Lab y se prefiere mantener separada porque es utilizable por futuras features (ej: audit_gateway).

## Interconexiones

Entradas:
- Consumida por UI modal del Attack Lab: `src/ui/features/attack_lab/panel/WordlistManagerModal.tsx`.

IPC:
- Comandos Tauri: `get_dictionary`, `add_to_dictionary`, `update_in_dictionary`, `remove_from_dictionary`
- Nota: actualmente se invoca via `@tauri-apps/api/core` (`invoke`) desde el hook (no via adapter dedicado).

Hook principal:
- `src/ui/features/wordlist/hooks/useWordlistManager.ts`

## Tests

- Hook: `src/ui/features/wordlist/__tests__/useWordlistManager.test.ts`
