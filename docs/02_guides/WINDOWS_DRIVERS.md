<!-- docs/02_guides/WINDOWS_DRIVERS.md -->
<!-- Descripcion: dependencias Windows (drivers) necesarias para ciertas features. -->

# Windows: Drivers requeridos (Npcap)

NetSentinel 3D puede funcionar sin drivers extra para:
- UI / paneles
- Scan de red basico
- Historial / snapshots

Pero estas features dependen de captura/inyeccion de paquetes:
- `LIVE TRAFFIC` (captura)
- `KILL NET` (inyeccion ARP)

En Windows, esas features requieren **Npcap** (provee `Packet.dll` y `wpcap.dll`).

## Como saber si te falta
Si al instalar/ejecutar en una VM te aparece algo como:
- "falta `Packet.dll`"

Significa que no esta instalado Npcap (o no esta en las rutas tipicas de Windows).

## Instalacion (manual)
1. Instala Npcap en el sistema.
2. Reinicia el programa (a veces Windows no expone el driver hasta reabrir).

## Nota sobre empaquetar Npcap en el instalador
Este repo soporta un modo de instalacion con **minima friccion**:
- El instalador detecta si falta Npcap.
- Si falta, ofrece instalarlo durante la instalacion (con UAC / admin).

Implementacion (Tauri/NSIS):
- Hooks:
  - Interactivo: `src-tauri/installer/npcap_hooks_interactive.nsh`
  - OEM silent: `src-tauri/installer/npcap_hooks_oem_silent.nsh`
- Config: `src-tauri/tauri.conf.json` (`bundle.windows.nsis.installerHooks`)
- El binario `npcap-installer.exe` **no se commitea**.
- Por defecto el instalador solo muestra un mensaje (sin auto-instalar).
- Si quieres que el instalador lo ejecute, debes:
  - poner el binario en `src-tauri/installer/deps/npcap-installer.exe`
  - y construir con config alternativa:
    - `npm run tauri:build:with-npcap`

Notas:
- Instalar drivers requiere permisos de Administrador en Windows.
- La redistribucion/silent de Npcap puede tener condiciones (OEM). Si no quieres redistribuirlo, deja solo el mensaje informativo.
