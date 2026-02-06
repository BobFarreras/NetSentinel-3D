# /docs/ARCHITECTURE.md

# Arquitectura Técnica de NetSentinel 3D (Rust Migration)

## 1. Visión General: Hybrid Architecture
NetSentinel evoluciona hacia una arquitectura híbrida de alto rendimiento.
* **Frontend:** Single Page Application (SPA) reactiva.
* **Backend:** Binario nativo compilado en Rust.
* **Puente:** Tauri IPC (Inter-Process Communication) asíncrono.



### Principio Fundamental: Seguridad y Rendimiento
Al mover la lógica a Rust, eliminamos el overhead de Node.js y ganamos **Memory Safety**. El Frontend no tiene acceso directo al sistema operativo, debe solicitarlo al Backend a través de "Comandos" explícitos.

---

## 2. Capas del Sistema (The Rust Onion)

### Capa 1: Dominio (Modelos)
* **Ubicación:** `src-tauri/src/models.rs`
* **Responsabilidad:** Define la estructura de datos pura.
* **Tecnología:** Rust Structs con derivación de `Serde` (Serialización).
* **Ejemplo:** `pub struct Device { ip: String, mac: String ... }`

### Capa 2: Aplicación (Comandos)
* **Ubicación:** `src-tauri/src/network_commands.rs`
* **Responsabilidad:** Contiene la lógica de negocio y orquestación.
* **Equivalente Hexagonal:** Use Cases.
* **Ejemplo:** `audit_target` decide qué puertos escanear y cómo interpretar los resultados.

### Capa 3: Infraestructura (Adaptadores)
* **Ubicación:** `src-tauri/src/history_commands.rs` y librerías nativas.
* **Responsabilidad:** Hablar con el "mundo exterior" (Disco duro, Tarjeta de Red).
* **Tecnología:** `std::fs`, `std::net`, `directories`.

### Capa 4: Presentación (UI)
* **Ubicación:** `src/ui`
* **Responsabilidad:** Renderizar el estado.
* **Patrón:** El hook `useNetworkManager` actúa como el "Controlador", invocando comandos de Rust y actualizando el estado de React.

---

## 3. Comunicación Frontend-Backend

El flujo de datos es unidireccional y tipado:

1.  **UI (React):** Llama a `invoke('scan_network')`.
2.  **Tauri Bridge:** Serializa la petición y la pasa a Rust.
3.  **Rust (Command):** Ejecuta la lógica (puede lanzar hilos paralelos).
4.  **Rust:** Devuelve un `Vec<Device>`.
5.  **Tauri Bridge:** Serializa a JSON.
6.  **UI:** Recibe una Promesa resuelta con datos tipados (`DeviceDTO[]`).

---

## 4. Estrategia de Persistencia

Para garantizar la compatibilidad con Windows, Linux y macOS, abandonamos las rutas relativas.

* **Librería:** `directories` (Rust Crate).
* **Ruta en Windows:** `C:\Users\{Usuario}\AppData\Roaming\com.netsentinel.app\data\history.json`
* **Política:** Rotación automática. Se mantienen las últimas 50 sesiones. Las antiguas se eliminan al guardar una nueva.

---

## 5. Estándares de Type Safety

### Rust (Backend)
* El compilador de Rust garantiza que no haya errores de memoria ni condiciones de carrera (Race Conditions) en el escaneo multihilo.
* Uso estricto de `Result<T, E>` para manejo de errores. Nada de `try/catch` globales.

### TypeScript (Frontend)
* Los DTOs en `src/shared/dtos` deben ser un espejo exacto de los Structs en `models.rs`.
* Se prohíbe el uso de `any` para datos que provienen de Rust.