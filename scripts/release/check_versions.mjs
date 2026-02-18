// scripts/release/check_versions.mjs
// Verifica que las versiones (package.json, Cargo.toml, tauri.conf.json) estan sincronizadas.

import fs from 'node:fs';
import path from 'node:path';

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function parseJsonVersion(filePath) {
  const raw = readText(filePath);
  const json = JSON.parse(raw);
  if (typeof json.version !== 'string' || !json.version.trim()) {
    throw new Error(`No se encontro "version" en ${filePath}`);
  }
  return json.version.trim();
}

function parseCargoTomlVersion(filePath) {
  const raw = readText(filePath);
  // Buscamos la primera ocurrencia de version dentro del [package].
  // (No parseamos TOML completo para evitar dependencias en tooling.)
  const pkgIdx = raw.indexOf('[package]');
  if (pkgIdx < 0) throw new Error(`No se encontro [package] en ${filePath}`);
  const after = raw.slice(pkgIdx);

  const m = after.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
  if (!m) throw new Error(`No se encontro version = \"...\" en ${filePath}`);
  return m[1].trim();
}

function normalizeTagToVersion(tag) {
  const t = String(tag || '').trim();
  if (!t) return null;
  return t.startsWith('v') ? t.slice(1) : t;
}

function parseArgs(argv) {
  const out = { tag: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tag') out.tag = argv[i + 1] ?? null;
  }
  return out;
}

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));

const packageJsonPath = path.join(repoRoot, 'package.json');
const tauriConfPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.json');
const tauriConfNpcapPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.with_npcap.json');
const cargoTomlPath = path.join(repoRoot, 'src-tauri', 'Cargo.toml');

const versions = {
  packageJson: parseJsonVersion(packageJsonPath),
  tauriConf: parseJsonVersion(tauriConfPath),
  cargoToml: parseCargoTomlVersion(cargoTomlPath),
};

// Si existe config alternativa (con Npcap), tambien debe estar sincronizada.
if (fs.existsSync(tauriConfNpcapPath)) {
  versions.tauriConfWithNpcap = parseJsonVersion(tauriConfNpcapPath);
}

const unique = new Set(Object.values(versions));
if (unique.size !== 1) {
  console.error('Versiones desincronizadas:');
  console.error(`- package.json: ${versions.packageJson}`);
  console.error(`- src-tauri/tauri.conf.json: ${versions.tauriConf}`);
  if (versions.tauriConfWithNpcap) {
    console.error(`- src-tauri/tauri.conf.with_npcap.json: ${versions.tauriConfWithNpcap}`);
  }
  console.error(`- src-tauri/Cargo.toml: ${versions.cargoToml}`);
  process.exit(2);
}

const unified = [...unique][0];
const expected = normalizeTagToVersion(args.tag ?? process.env.GITHUB_REF_NAME);
if (expected && unified !== expected) {
  console.error(`Version sincronizada (${unified}) pero no coincide con el tag esperado (${expected}).`);
  process.exit(3);
}

console.log(`OK: version sincronizada = ${unified}${expected ? ` (tag=${expected})` : ''}`);
