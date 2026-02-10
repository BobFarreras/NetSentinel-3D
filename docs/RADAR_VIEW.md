# Radar View (WiFi Spectrum) - Guia de Implementacion

## 1. Objetivo
Implementar `Radar View` como modulo de reconocimiento de espectro WiFi para laboratorio educativo:
- visualizar redes cercanas, solapamiento de canales y nivel de señal,
- clasificar riesgo de configuracion (legacy vs hardened),
- entrenar criterio tecnico sin ejecutar ataques reales.

## 2. Alcance y limites
Alcance permitido:
- escaneo de infraestructura WiFi visible (BSSID/SSID/canal/RSSI/seguridad),
- inferencia defensiva de riesgo,
- simulaciones educativas controladas (sin trafico ofensivo real).

Fuera de alcance:
- instrucciones operativas para comprometer redes de terceros,
- implementacion de ataques reales (captura/abuso de credenciales, explotacion activa no autorizada).

## 3. Arquitectura propuesta
### 3.1 Backend Rust
- Nuevo servicio: `src-tauri/src/application/wifi_service.rs`
- Nuevo comando Tauri: `scan_airwaves`
- DTO Rust: `WifiNetworkDTO` en `src-tauri/src/api/dtos.rs`
- Normalizacion de datos:
  - `bssid`, `ssid`, `channel`, `signal_level`, `security_type`,
  - `distance_mock` (derivada de RSSI),
  - `risk_level` (`HARDENED`, `STANDARD`, `LEGACY`, `OPEN`),
  - `inference_flags` (heuristicas defensivas).

### 3.2 Frontend React
- Adapter: `src/adapters/wifiAdapter.ts`
- Hook: `src/ui/hooks/modules/useWifiRadar.ts`
- Vista: `src/ui/components/3d/RadarView.tsx`
- Integracion en layout principal con panel de detalle lateral.

## 4. Simulaciones educativas 2026 (sin ejecucion ofensiva real)
### A) PMKID (Client-less) -> Modo simulacion
Objetivo didactico:
- explicar que existe vector contra AP sin depender de clientes.

Implementacion en NetSentinel:
- no se ejecuta ataque real,
- se muestra `pmkidExposureScore` por heuristica:
  - seguridad declarada,
  - firmware/edad estimada por OUI,
  - configuracion observada (si disponible por API del SO),
  - historial local de robustez en laboratorio.

Salida UI:
- estado `LOW/MEDIUM/HIGH` con explicacion textual.

### B) IoT (riesgo por superficie)
Objetivo didactico:
- identificar dispositivos tipicamente debiles en redes domesticas/lab.

Implementacion:
- clasificacion por OUI/vendor en categoria `iotProfile`:
  - `GENERAL_COMPUTE`, `MOBILE`, `IOT_CONSUMER`, `INFRASTRUCTURE`.
- score de riesgo por combinacion:
  - tipo de seguridad,
  - señal fuerte + canal saturado,
  - vendor con historial de soporte limitado.

Salida UI:
- etiqueta visual de riesgo y recomendaciones de hardening.

### C) Wi-Fi 7 / MLO (analisis multi-banda)
Objetivo didactico:
- enseñar que un mismo SSID puede operar en varias bandas.

Implementacion:
- agrupacion de entradas por SSID/BSSID-related en `superNode`,
- indicador `multiBand: true/false`,
- mapa polar con subnodos por banda/canal.

Salida UI:
- panel con vista agregada y detalle por banda.

## 5. Modelo visual Radar View
- Centro: host local.
- Orbita: distancia inferida por RSSI (`distance_mock`).
- Color por riesgo:
  - verde: `HARDENED`,
  - amarillo: `STANDARD`,
  - rojo: `LEGACY`/`OPEN`.
- Grid polar de referencia (10m/20m/50m).
- Sweep line con highlight no bloqueante.
- Tooltip seguro (texto plano, sin HTML inyectado).

## 6. Seguridad y compliance
- Modal legal al primer uso:
  - "Uso exclusivo en redes propias o autorizadas."
- Sanitizacion de SSID/BSSID antes de render:
  - evitar caracteres de control y payloads de inyeccion.
- Registro local de acciones de escaneo para trazabilidad.

## 7. Plan de implementacion por fases
1. Fase 0 - Contratos y comando base:
   - DTO Rust/TS + `scan_airwaves`.
2. Fase 1 - Hook y adapter:
   - `useWifiRadar` + `wifiAdapter`.
3. Fase 2 - Vista inicial:
   - Radar 2D/3D con colores y filtros.
4. Fase 3 - Simulaciones:
   - PMKID/IoT/MLO en modo inferencia.
5. Fase 4 - Hardening:
   - modal legal, sanitizacion, telemetria local.
6. Fase 5 - QA:
   - tests unitarios, integracion y E2E.

## 8. Criterios de aceptacion
- El escaneo no bloquea UI.
- `JAMMED`, `TARGET` y `SYSTEM LOGS` siguen estables tras integrar Radar.
- Riesgo visual y detalle textual son consistentes.
- Tests verdes:
  - `npm test -- --run`
  - `npm run build`
  - `cargo check`

