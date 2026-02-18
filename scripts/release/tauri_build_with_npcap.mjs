// scripts/release/tauri_build_with_npcap.mjs
// Build Tauri usando una config alternativa que incluye Npcap como recurso.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = process.cwd();

const gen = spawnSync(process.execPath, ['scripts/release/make_tauri_config_with_npcap.mjs'], {
  cwd: repoRoot,
  stdio: 'inherit',
});
if (gen.status !== 0) process.exit(gen.status ?? 1);

// Importante:
// - En Tauri v2, `TAURI_CONFIG` es JSON inline para merge, NO una ruta.
// - Para usar un config alternativo usamos `tauri build --config <path>`.
const configPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.with_npcap.json');

// Ejecutamos el CLI via Node (entrypoint JS) para evitar problemas de `.cmd` y espacios en rutas.
const tauriCliJs = path.join(repoRoot, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
const build = spawnSync(process.execPath, [tauriCliJs, 'build', '--config', configPath], {
  cwd: repoRoot,
  stdio: 'inherit',
});

// Si el proceso no pudo spawnearse, mostramos el motivo.
if (build.error) {
  console.error(`[tauri_build_with_npcap] No se pudo ejecutar Tauri CLI: ${build.error.message}`);
}

process.exit(build.status ?? 1);
