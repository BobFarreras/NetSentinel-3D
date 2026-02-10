# 🌐 N E T S E N T I N E L /// 3 D
### The Rust-Powered Network Intelligence Interface

![Status](https://img.shields.io/badge/STATUS-OPERATIONAL-brightgreen?style=for-the-badge)
![Core](https://img.shields.io/badge/CORE-RUST_V2-orange?style=for-the-badge)
![UI](https://img.shields.io/badge/VISUAL-REACT_THREE_FIBER-blue?style=for-the-badge)
![Security](https://img.shields.io/badge/GRADE-MILITARY-red?style=for-the-badge)

> *"The Net is vast and infinite. We just light it up."*

---

## 📂 MISSION BRIEFING
Benvingut a **NetSentinel 3D**, Operatiu.

Aquesta no és una eina d'administració de xarxa normal. És un **Visualitzador Tàctic de Ciberseguretat** dissenyat per revelar la infraestructura invisible que t'envolta.

Hem abandonat l'antic nucli (Legacy Node.js) per forjar un nou motor en **Rust** sobre l'arquitectura **Tauri**. El resultat? Un rendiment extrem, ús de memòria mínim i capacitat d'auditoria en temps real sense bloquejar la interfície hologràfica.

### ⚡ CAPACITATS DEL SISTEMA (System Modules)

| Mòdul | Nom en Clau | Descripció |
| :--- | :--- | :--- |
| **RADAR** | `NetworkDiscovery` | Escaneig multithread per detectar nodes (IP/MAC) en mil·lisegons. |
| **VISUAL** | `SolarSystem` | Representació 3D de la topologia. El Router és el Sol; els dispositius són planetes. |
| **AUDIT** | `DeepInspect` | Connexions TCP reals per detectar ports oberts i vulnerabilitats crítiques. |
| **INTEL** | `CyberBrain` | Creuament de dades per identificar riscos (Telnet, HTTP, SMB exposat). |
| **MEMORY** | `BlackBox` | Persistència automàtica de sessions a `%APPDATA%`. |

---

## 🛠️ THE ARSENAL (Tech Stack)

Aquest projecte utilitza una **Arquitectura Híbrida d'Alt Rendiment**:

* **🧠 THE BRAIN (Backend):** [Rust](https://www.rust-lang.org/) + [Tauri](https://tauri.app/)
    * Gestió de fils (Threads), Sockets TCP, Escriptura de fitxers segura.
* **👁️ THE EYES (Frontend):** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    * Interfície d'usuari reactiva i tipatge estricte.
* **🪐 THE WORLD (3D Engine):** [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
    * Renderitzat WebGL accelerat per hardware.

---

## 🔌 INITIALIZATION PROTOCOL (Setup Guide)

Atenció, Recluta. Segueix aquests passos per sincronitzar el teu terminal amb el codi font.

### 1. Prerequisits (Pre-Flight Check)
Assegura't de tenir instal·lat:
* **Node.js** (v18 o superior) -> [Descarregar](https://nodejs.org/)
* **Rust & Cargo** (El compilador) -> [Descarregar](https://rustup.rs/)
* **VS Code** amb les extensions:
    * *Tauri*
    * *rust-analyzer*
    * *ESLint*


### 1. Prerequisits (Development Environment)
Per compilar el codi font necessites les següents eines:

* **Rust & Cargo** (El nucli): Necessari per compilar el Backend.
    * [Instruccions d'instal·lació](https://rustup.rs/)
* **Node.js & npm** (Les eines): Necessari **només** per gestionar les llibreries de React i executar Vite.
    * *Nota: L'usuari final de l'app no necessitarà tenir Node instal·lat.*
    * [Descarregar LTS](https://nodejs.org/)
* **VS Code** (Recomanat) amb extensions: `Tauri`, `rust-analyzer`.

### 2. Clonat del Repositori (Jack In)
```bash
git clone [https://github.com/EL_TEU_USUARI/netsentinel.git](https://github.com/EL_TEU_USUARI/netsentinel.git)
cd netsentinel-rust
```

## 📡 Guía de LIVE TRAFFIC

El panel `LIVE TRAFFIC` muestra paquetes capturados en tiempo real y permite filtrar por contexto operativo.

### Estados y colores

- Verde:
  - tráfico permitido/no interceptado.
  - normalmente paquetes `TCP`.
- Amarillo:
  - tráfico no interceptado de otros protocolos (por ejemplo `UDP`).
- Rojo:
  - paquete interceptado/bloqueado (`isIntercepted = true`).
  - en columna `TYPE` aparece como `BLK`.

### Columnas

- `TYPE`:
  - tipo de tráfico (`TCP`, `UDP`) o `BLK` si está interceptado.
- `SRC`:
  - origen del paquete.
  - prioriza nombre conocido del dispositivo (vendor/hostname) cuando existe.
- `DST`:
  - destino del paquete.
  - aplica la misma resolución de nombre que `SRC`.
- `DATA`:
  - resumen corto del contenido/metadata (`pkt.info`).

### Filtros

- `ALL`:
  - muestra todo el buffer general en vivo.
- `JAMMED`:
  - muestra solo paquetes interceptados.
- `TARGET`:
  - muestra solo paquetes donde participa el nodo seleccionado.
  - la etiqueta del botón prioriza `vendor` del nodo objetivo.

## 🧩 Guía paso a paso para implementar prioridades

Esta guía define cómo aplicar las prioridades actuales sin romper el sistema:

1. Alinear comentarios/documentación al castellano:
   - revisar solo archivos afectados por el cambio.
   - reemplazar comentarios ambiguos por explicaciones técnicas cortas.
2. Corregir `SYSTEM LOGS`:
   - asegurar `minHeight: 0` en contenedores flex con scroll.
   - usar `whiteSpace: pre-wrap` + `overflowWrap: anywhere` para evitar texto cortado.
3. Corregir `LIVE TRAFFIC`:
   - verificar que `TrafficPanel` recibe `jammedPackets`.
   - validar filtros `ALL`, `JAMMED` y `TARGET` con datos simulados/interceptados.
   - priorizar nombre de `vendor` o `hostname` en etiqueta del objetivo.
4. Documentar comportamiento:
   - actualizar `README.md` con colores, columnas y filtros.
   - registrar cambios relevantes en `docs/CHANGELOG.md`.
5. Validar antes de cerrar:
   - `npm test -- --run`
   - `npm run build`
   - `cargo check` (si hubo cambios en Rust)

## 🛰️ Roadmap inmediato: Radar View (WiFi Spectrum)

Se ha definido la arquitectura de `Radar View` para reconocimiento pasivo de espectro WiFi.

- Documento tecnico: `docs/RADAR_VIEW.md`
- Enfoque:
  - escaneo de infraestructura visible (SSID/BSSID/canal/RSSI),
  - clasificacion de riesgo visual,
  - simulaciones educativas controladas de PMKID/IoT/MLO en modo inferencia.
- Restriccion:
  - no se incorporan automatizaciones ofensivas reales.

## 🧰 External Audit / LAB Audit

NetSentinel incluye un wrapper para ejecutar herramientas CLI existentes (sin reimplementar su logica) y un catalogo de escenarios didacticos.

- Guia completa: `docs/EXTERNAL_AUDIT.md`
