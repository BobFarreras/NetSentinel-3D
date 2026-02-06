# PRODUCT.md - Especificación Funcional de NetSentinel 3D (Rust Edition)

## 1. Visión del Producto
NetSentinel 3D es una plataforma de **Ciberseguridad Defensiva y Visualización** de alto rendimiento para entornos domésticos.
Transforma datos abstractos de red (IPs, Puertos, Latencia) en un entorno 3D gamificado (Sistema Solar), permitiendo a usuarios no técnicos entender, monitorizar y proteger su infraestructura digital sin el consumo de recursos de las herramientas corporativas pesadas.

---

## 2. Perfil de Usuario (User Persona)
* **Target:** Estudiantes, trabajadores remotos, gamers y entusiastas tech.
* **Dolor:** "Mi internet va lento", "No sé si mi vecino me roba wifi", "No entiendo qué es un puerto abierto", "Las herramientas de hacking son consola pura y difíciles".
* **Objetivo:** Tener un panel de control tipo "Minority Report" para su casa: visual, rápido y efectivo.

---

## 3. Funcionalidades Core (El "Qué")

### A. El Radar (Network Discovery)
El sistema utiliza el motor de Rust para detectar dispositivos en la red local.
* **Comportamiento:** Al iniciar, lanza hilos paralelos para mapear la red `/24`.
* **Datos requeridos:** IP, MAC Address, Fabricante (Vendor) y Latencia.
* **Visualización:** El Router se sitúa en el centro (Sol) y los dispositivos orbitan a su alrededor.

### B. El Auditor (Deep Inspection)
Herramienta de análisis de vulnerabilidades bajo demanda.
* **Acción:** El usuario hace clic en un planeta y selecciona "DEEP AUDIT".
* **Operación:** Rust abre conexiones TCP reales contra los puertos más comunes (21, 22, 23, 80, 443, 3389, etc.).
* **Ciber-Inteligencia:**
    * Cruza los puertos abiertos con una base de datos de vulnerabilidades.
    * **Ejemplo:** Si detecta el puerto 23 (Telnet), marca el riesgo como **CRITICAL** y sugiere "Deshabilitar inmediatamente".
    * **Ejemplo:** Si detecta el puerto 80 (HTTP), sugiere "Migrar a HTTPS".

### C. El Escudo (Defensa Activa / Kill Switch)
Sistema de respuesta ante intrusiones.
* **Funcionalidad:** "Jammer" o desconexión selectiva.
* **Acción:** Botón "KILL NET" en el panel del dispositivo.
* **Efecto:** Corta la comunicación del dispositivo seleccionado con el Router (simulado visualmente en MVP, preparado para ARP Spoofing real).
* **Feedback:** El botón parpadea en rojo y el planeta se marca visualmente como "JAMMED".

### D. La Memoria (Historial y Persistencia)
Sistema de registro automático.
* **Persistencia:** Cada escaneo se guarda automáticamente en disco (`%APPDATA%`).
* **Auto-Load:** Al abrir la aplicación, se restaura el estado de la última sesión conocida.
* **Gestión:** El usuario puede navegar por sesiones pasadas ("Snapshot del Lunes") para comparar cambios.

---

## 4. Guía Técnica de Comportamiento (El "Cómo")

### Flujo de Datos (Arquitectura Tauri)
1.  **UI Trigger:** Usuario pulsa "SCAN". React llama a `invoke('scan_network')`.
2.  **Rust Core:** El backend recibe el comando.
    * Si es un Escaneo: Lanza `threads` para barrer la IP range.
    * Si es Auditoría: Lanza `TcpStream` con timeouts de 400ms.
    * Si es Guardado: Usa `serde_json` para escribir en disco.
3.  **Respuesta:** Rust devuelve un `Vector` de Structs (`Vec<Device>`).
4.  **Render:** Tauri serializa a JSON y React actualiza el estado de `useNetworkManager`.

### Gestión de Errores y Seguridad
* **Timeouts:** Si un dispositivo no responde al ping en 500ms, Rust corta la conexión para no congelar la UI.
* **Permisos:** La escritura de historial crea automáticamente las carpetas necesarias en `AppData` si no existen.
* **Memory Safety:** El uso de Rust garantiza que no habrá fugas de memoria (Memory Leaks) durante escaneos largos, a diferencia de la versión anterior en Node.js.

---

## 5. Requisitos No Funcionales
* **Privacidad:** Cero telemetría. Ningún dato sale de `localhost`. Todo el procesamiento es local.
* **Rendimiento (Rust):**
    * El backend debe consumir < 50MB de RAM.
    * El tamaño del instalador debe ser < 10MB (vs los 100MB+ de Electron).
* **Fluidez:** La escena 3D debe mantenerse a 60FPS incluso mientras Rust está auditando puertos en segundo plano.