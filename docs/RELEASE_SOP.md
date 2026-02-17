<!-- docs/RELEASE_SOP.md -->
<!-- Descripcion: protocolo simple y repetible para fabricar y publicar releases via GitHub Actions (tags v*). -->

# 🚀 NETSENTINEL: PROTOCOLO DE DESPLIEGUE (RELEASE SOP)

**CLASIFICACION:** INTERNO / OPERADORES  
**ESTADO:** ACTIVO  
**MOTOR:** GitHub Actions (`.github/workflows/release.yml`)

## 0. Idea principal (para no liarla)
NetSentinel no se “sube a mano”. Se **construye** y se **publica** con un flujo automatizado para que el binario salga siempre igual, limpio y trazable.

Piensa en esto como una “fabrica”:
1. Tu pones una etiqueta de version (tag).
2. GitHub hace la build.
3. GitHub crea un Release (en borrador).
4. Un operador valida y publica.

## 1. Sistema de versionado (SEMVER)
Usamos Semantic Versioning: `vMAJOR.MINOR.PATCH`

- **MAJOR (`v1.0.0`)**: cambios grandes que rompen compatibilidad.
- **MINOR (`v0.2.0`)**: nuevas features / nuevas capacidades.
- **PATCH (`v0.1.1`)**: fixes, mejoras pequeñas, hardening.

Regla obligatoria:
- El tag **siempre** empieza por `v`.
  - Correcto: `v0.8.80`
  - Incorrecto: `0.8.80`, `release-0.8.80`

## 2. Antes de hacer release (checklist corta)
1. Rama `main` limpia (sin cambios sin commitear).
2. Validaciones minimas en verde:

```bash
npm test -- --run
npm run build
cd src-tauri
cargo check
```

Nota Windows:
- `cargo test` puede requerir elevacion o fallar por dependencias del driver. Si pasa, deja evidencia en `docs/CHANGELOG.md` y continua con `cargo check` como minimo.

## 3. Procedimiento (paso a paso)
### Paso 1: elegir la version
Decide el numero. Ejemplo: `v0.8.81`.

### Paso 2: crear el tag local
```bash
git tag v0.8.81
```

### Paso 3: empujar el tag (esto detona la fabrica)
```bash
git push origin v0.8.81
```

Con ese push, el workflow de GitHub Actions se dispara automaticamente.

## 4. Que hace el motor (release.yml)
Fuente de verdad: `.github/workflows/release.yml`

Disparo:
- Se ejecuta **solo** cuando haces push de un tag `v*`.

Pipeline (resumen):
1. Checkout del repo.
2. Setup Node.js 20.
3. Instala Rust stable.
4. `npm ci` (dependencias frontend).
5. Ejecuta `tauri-apps/tauri-action`:
   - Compila la app Tauri en modo release.
   - Sube los artefactos como assets del Release.
   - Crea el Release como **Draft** (borrador) por defecto.

Estado actual del workflow:
- Plataforma: **Windows** (`windows-latest`).
- `releaseDraft: true` (no se publica automaticamente, requiere revision humana).

Limitacion actual:
- Este repo solo fabrica binarios **Windows**. macOS/Linux no estan soportados ni validados todavia, asi que no se genera release multi-OS.

## 5. Verificacion post-despliegue (antes de publicar)
1. En GitHub: ir a `Releases` y abrir el Release en borrador.
2. Descargar el instalador/asset generado.
3. Probar en entorno controlado:
   - Arranque de UI.
   - Scan basico.
   - Audit basico.
   - Traffic panel (si aplica).
4. Confirmar que la version que muestra la UI coincide con el tag.
5. Si todo esta ok: publicar el Release (quitar draft).

## 6. Problemas tipicos (y que hacer)
- **El workflow no se ejecuta**:
  - Revisa que el tag empiece por `v` y que hiciste `git push origin <tag>`.
- **Falla en build**:
  - Abre el log del job en GitHub Actions y copia el error en `docs/CHANGELOG.md`.
- **Solo hay build de Windows**:
  - Es el estado actual. Para multi-OS, hay que extender el `matrix` del workflow.
