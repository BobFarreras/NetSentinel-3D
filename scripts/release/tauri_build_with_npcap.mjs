// scripts/release/tauri_build_with_npcap.mjs
// Build Tauri usando una config alternativa que incluye Npcap como recurso.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = process.cwd();

const gen = spawnSync('node', ['scripts/release/make_tauri_config_with_npcap.mjs'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (gen.status !== 0) process.exit(gen.status ?? 1);

const env = { ...process.env };
env.TAURI_CONFIG = path.join(repoRoot, 'src-tauri', 'tauri.conf.with_npcap.json');

const build = spawnSync('npx', ['tauri', 'build'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32',
});

process.exit(build.status ?? 1);

