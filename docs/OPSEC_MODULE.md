# Módulo OpSec & Ghost Mode

## 1. Introducción
El módulo **OpSec (Operational Security)** es el encargado de proteger la identidad del operador durante las auditorías. Su función principal es asegurar que la dirección física (MAC) expuesta en la red no sea trazable al hardware real del dispositivo.

## 2. Componentes
### 2.1 Backend (Rust)
- **`MacValidator` (Domain):** Verifica si una MAC cumple el estándar IEEE 802 para direcciones locales (LAA).
    - Bits válidos en el segundo carácter: `2`, `6`, `A`, `E`.
- **`MacChangerService` (Application):**
    - Abstracción sobre el sistema operativo para cambiar la MAC.
    - **Estrategia Windows:** No inyecta en el driver (fallo común en MediaTek/Intel modernos). En su lugar, manipula la configuración del servicio **WLAN AutoConfig (WlanSvc)** en el Registro.
    - Ruta clave: `HKLM\SOFTWARE\Microsoft\WlanSvc\Interfaces\{GUID}`.
    - Valor clave: `RandomMacSourceObject = 1`.
- **`OpSecService` (Application):** Coordina la validación, el almacenamiento de la MAC original y la ejecución del cambio.

### 2.2 Frontend (React)
- **`ConsoleDisplay` Interactivo:** Terminal que soporta prompts de selección (Flechas + Enter) para confirmar acciones críticas.
- **`CyberConfirmModal`:** Modal de seguridad antes de ataques activos.
    - **ROJO:** Identidad Real detectada (Peligro).
    - **VERDE:** Identidad Ofuscada/Spoofed (Seguro).

## 3. Flujo de Ejecución "Ghost Mode"
1. **Verificación de Privilegios:** El script de PowerShell verifica `[Security.Principal.WindowsPrincipal]`. Si no es Admin, aborta.
2. **Identificación Inteligente:**
    - Busca el adaptador por GUID (preciso).
    - Fallback: Busca por Nombre ("Wi-Fi").
3. **Inyección en Registro:**
    - Activa el interruptor nativo de Windows 10/11 "Direcciones de hardware aleatorias" programáticamente.
4. **Reinicio de Interfaz:**
    - `Disable-NetAdapter` -> `Enable-NetAdapter`.
    - Esto fuerza a Windows a generar una nueva MAC aleatoria basada en su propia criptografía.

## 4. Troubleshooting
### Error: "Acceso Denegado al Registro"
- Causa: La aplicación no se ejecutó como Administrador.
- Solución Dev: Abrir VS Code con "Ejecutar como administrador".
- Solución Prod: El `app.manifest` fuerza la elevación al abrir el `.exe`.

### Error: "Adaptador no encontrado"
- Causa: El GUID de la interfaz ha cambiado (ej: cambio de hardware o drivers).
- Solución: El script tiene lógica de fallback para buscar por nombre.

## 5. Referencia de Comandos
- `check_mac_security`: Devuelve `{ current_mac, is_spoofed, risk_level }`.
- `randomize_mac`: Ejecuta la secuencia Ghost Mode y devuelve la nueva MAC.
- `get_identity`: Obtiene IP, MAC y Gateway actuales.