// scripts/release/set_version.mjs
// Ajusta la version en package.json, src-tauri/Cargo.toml y src-tauri/tauri.conf.json.

import fs from 'node:fs';
import path from 'node:path';

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeText(p, s) {
  fs.writeFileSync(p, s, 'utf8');
}

function assertSemver(v) {
  if (!/^\d+\.\d+\.\d+$/.test(v)) {
    throw new Error(`Version invalida "${v}". Esperado: X.Y.Z`);
  }
}

function replaceJsonVersion(filePath, version) {
  const raw = readText(filePath);
  // Reemplazo conservador para no reordenar JSON.
  const next = raw.replace(/("version"\s*:\s*")([^"]+)(")/, `$1${version}$3`);
  if (next === raw) throw new Error(`No se pudo actualizar "version" en ${filePath}`);
  writeText(filePath, next);
}

function replaceCargoTomlVersion(filePath, version) {
  const raw = readText(filePath);
  const pkgIdx = raw.indexOf('[package]');
  if (pkgIdx < 0) throw new Error(`No se encontro [package] en ${filePath}`);

  const head = raw.slice(0, pkgIdx);
  const tail = raw.slice(pkgIdx);
  const nextTail = tail.replace(/^\s*version\s*=\s*"([^"]+)"\s*$/m, `version = "${version}"`);
  if (nextTail === tail) throw new Error(`No se pudo actualizar version en ${filePath}`);
  writeText(filePath, head + nextTail);
}

const version = process.argv[2]?.trim();
if (!version) {
  console.error('Uso: npm run release:set-version -- X.Y.Z');
  process.exit(1);
}

assertSemver(version);

const repoRoot = process.cwd();
replaceJsonVersion(path.join(repoRoot, 'package.json'), version);
replaceJsonVersion(path.join(repoRoot, 'src-tauri', 'tauri.conf.json'), version);
replaceCargoTomlVersion(path.join(repoRoot, 'src-tauri', 'Cargo.toml'), version);

console.log(`OK: version actualizada a ${version}`);

