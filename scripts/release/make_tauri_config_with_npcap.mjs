// scripts/release/make_tauri_config_with_npcap.mjs
// Genera una config Tauri alternativa que empaqueta el instalador de Npcap como recurso.

import fs from 'node:fs';
import path from 'node:path';

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function assertExists(p, msg) {
  if (!fs.existsSync(p)) throw new Error(msg);
}

const repoRoot = process.cwd();
const basePath = path.join(repoRoot, 'src-tauri', 'tauri.conf.json');
const outPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.with_npcap.json');

// Permitimos dos ubicaciones locales (ambas ignoradas por git):
// - src-tauri/resources/npcap-installer.exe (mas simple para bundle.resources)
// - src-tauri/installer/deps/npcap-installer.exe (legacy)
const resourcePath = path.join(repoRoot, 'src-tauri', 'resources', 'npcap-installer.exe');
const legacyPath = path.join(repoRoot, 'src-tauri', 'installer', 'deps', 'npcap-installer.exe');
const installerPath = fs.existsSync(resourcePath) ? resourcePath : legacyPath;

assertExists(
  installerPath,
  `No existe el instalador de Npcap.\n` +
    `Colocalo en:\n` +
    `- ${resourcePath}\n` +
    `o\n` +
    `- ${legacyPath}\n` +
    `(no se commitea).`,
);

const base = readJson(basePath);

base.bundle = base.bundle ?? {};
const resources = base.bundle.resources && typeof base.bundle.resources === 'object' ? base.bundle.resources : {};
// Normalizamos: siempre instalamos al setup bajo $INSTDIR\\resources\\deps\\npcap-installer.exe
if (installerPath === resourcePath) {
  resources['resources/npcap-installer.exe'] = 'deps/npcap-installer.exe';
} else {
  resources['installer/deps/npcap-installer.exe'] = 'deps/npcap-installer.exe';
}
base.bundle.resources = resources;

// Hook NSIS: por defecto usamos el modo interactivo.
if (base.bundle?.windows?.nsis) {
  base.bundle.windows.nsis.installerHooks = 'installer/npcap_hooks_interactive.nsh';
}

writeJson(outPath, base);
console.log(`OK: generado ${path.relative(repoRoot, outPath)}`);
