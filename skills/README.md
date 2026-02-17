<!-- Ruta: skills/README.md -->
<!-- Descripcion: carpeta de skills versionados del repo. Contiene instrucciones accionables (SKILL.md) para tareas recurrentes, cargadas on-demand por agentes IA/juniors. -->

# Skills del repo

Esta carpeta contiene *skills* (habilidades) para ejecutar tareas recurrentes con el contexto minimo necesario.

Como funcionan:

- Discovery: el agente lee `name` + `description` de cada `SKILL.md`.
- Activacion: si la tarea encaja, carga el `SKILL.md` completo.
- Ejecucion: sigue los pasos, y puede leer `references/` o ejecutar scripts en `scripts/` si existen.

Reglas:

- Un skill debe ser pequeño y accionable (evitar "god skills").
- Debe referenciar rutas reales del repo (comandos, DTOs, entrypoints).
- Debe declarar Definition of Done (tests/build/check) si afecta a codigo.

Skills actuales:

- `skills/release-checks/SKILL.md`
- `skills/tauri-command-change/SKILL.md`
- `skills/feature-readme/SKILL.md`
- `skills/attack-lab-scenario/SKILL.md`

