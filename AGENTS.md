# AGENTS.md - Planificación Arquitectónica de "NetSentinel 3D" (Rust Edition)

## 1. Misión del Proyecto
Desarrollar **NetSentinel 3D**, una herramienta de escritorio de ciberseguridad defensiva de alto rendimiento. El objetivo es visualizar la infraestructura de red invisible mediante un motor gráfico 3D, utilizando la potencia y seguridad de memoria de **Rust** en el backend y la reactividad de **React** en el frontend.

## 🤖 Rol del Agente Principal
Tu nombre es **NetSentinel**. Eres un auditor de ciberseguridad autónomo residente en una aplicación Tauri.
Tu misión es **proteger, visualizar y educar**.

## 🧠 Arquitectura Cognitiva
Dispones de **Habilidades (Capabilities)** modulares.
A diferencia de la versión anterior (Node.js), tus habilidades son nativas (Rust), lo que te permite operar a nivel de sistema con mayor velocidad y seguridad.

## 🛠️ Skills Disponibles (Herramientas Rust)

Tus capacidades ahora residen en el directorio `@src-tauri/src`:

### 1. Skill de Reconocimiento (`@ScanSkill`)
* **Nombre Técnico:** `scan_network`
* **Descripción:** Escaneo de red mediante hilos nativos (Threads).
* **Ubicación:** `@src-tauri/src/network_commands.rs`

### 2. Skill de Auditoría (`@AuditSkill`)
* **Nombre Técnico:** `audit_target`
* **Descripción:** Análisis profundo de puertos TCP mediante `TcpStream` y cruce de datos con inteligencia de vulnerabilidades.
* **Ubicación:** `@src-tauri/src/network_commands.rs`

### 3. Skill de Memoria (`@StorageSkill`)
* **Nombre Técnico:** `history_commands`
* **Descripción:** Persistencia segura en disco (`AppData`) utilizando serialización Serde.
* **Ubicación:** `@src-tauri/src/history_commands.rs`

---

## 2. Filosofía Arquitectónica: Pragmatic Hexagonal
1.  **Frontend Tonto (View):** React (`src/`) solo visualiza datos. No toma decisiones ni realiza cálculos de red.
2.  **Backend Robusto (Core):** Rust (`src-tauri/`) gestiona la lógica, la red y el sistema de archivos.
3.  **Type Safety:** Los modelos se comparten mediante DTOs estrictos (`models.rs` <-> `NetworkDTOs.ts`).

---

## 3. Estructura de Directorios (Folder Structure)

Esta estructura separa físicamente el "Cerebro" (Rust) del "Cuerpo" (React).

```text
/netsentinel-rust
├── /src                          # 🎨 FRONTEND (React + Vite)
│   ├── /shared                   # 🤝 CONTRATOS
│   │   └── /dtos                 # Interfaces TypeScript (espejo de models.rs)
│   │       └── NetworkDTOs.ts
│   │
│   └── /ui                       # 👁️ VISTA
│       ├── /components
│       │   ├── /3d               # Escena Three.js
│       │   └── /hud              # Paneles 2D (Detalles, Historial)
│       └── /hooks                # Lógica de UI (useNetworkManager)
│           └── (Llama a Rust vía 'invoke')
│
├── /src-tauri                    # 🦀 BACKEND (Rust Core)
│   ├── Cargo.toml                # Dependencias (serde, tokio, directories)
│   ├── tauri.conf.json           # Configuración de Seguridad y Permisos
│   └── /src
│       ├── lib.rs                # Punto de entrada y Registro de Comandos
│       ├── models.rs             # 🧠 DOMINIO (Structs: Device, Vulnerability)
│       ├── network_commands.rs   # ⚡ APLICACIÓN (Lógica de Escaneo y Auditoría)
│       └── history_commands.rs   # 💾 INFRAESTRUCTURA (Gestión de Archivos JSON)
``` 

## 4. Definición Detallada de Agentes y Skills

### 🧭 Agente: El Cartógrafo (Network Discovery)

**Responsabilidad:**  
Descubrir topología de red.

**Tecnología:**  
Rust Multithreading.

**Input:**  
Rango CIDR.

**Output:**  
`Vec<Device>` serializado a JSON.

---

### 🔐 Agente: El Auditor (Security Engine)

**Responsabilidad:**  
TCP Connect Scan + Vulnerability Matching.

**Tecnología:**  
`std::net::TcpStream` con timeouts agresivos.

**Regla:**  
Asigna niveles de riesgo (`LOW`, `HIGH`, `CRITICAL`) basados en el puerto y servicio.

---

### 💾 Agente: El Historiador (Persistence)

**Responsabilidad:**  
Gestión de sesiones.

**Tecnología:**  
Crate `directories` para encontrar rutas nativas (`%AppData%`).

**Regla:**  
Rotación automática (LIFO) manteniendo un máximo de **50 sesiones**.

---

## 5. Normas de Código (Style Guide)

### Rust

- `snake_case` para funciones y variables  
- `CamelCase` para `Structs`

### TypeScript

- `camelCase` para todo

### Comunicación Rust → Frontend

Rust debe usar:

```rust
#[serde(rename_all = "camelCase")]
```