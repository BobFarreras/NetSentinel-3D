<!-- docs/RADAR_VIEW.md -->

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
- Servicio: `src-tauri/src/application/wifi_service.rs`
- Normalizacion pura: `src-tauri/src/application/wifi_normalizer.rs`
- Nuevo comando Tauri: `scan_airwaves`
- DTO Rust: `WifiNetworkDTO` en `src-tauri/src/api/dtos.rs`
- Normalizacion de datos:
  - `bssid`, `ssid`, `channel`, `signal_level`, `security_type`,
  - `distance_mock` (derivada de RSSI),
  - `risk_level` (`HARDENED`, `STANDARD`, `LEGACY`, `OPEN`),
  - `inference_flags` (heuristicas defensivas).

Resolucion vendor:
- Backend usa resolucion por OUI para BSSID:
  - puerto `VendorLookupPort` (dominio),
  - adaptador `SystemVendorLookup` (infra) que delega en `VendorResolver`.

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

## 9. Windows: por que a veces solo se detecta 1 red (y como lo resolvimos)
En Windows, la cantidad de redes visibles no depende solo de NetSentinel: depende del stack WLAN, del driver y de las politicas de privacidad.

### 9.1 Fuente de verdad: `netsh`
NetSentinel usa un scanner de sistema que, en Windows, prioriza `netsh` por fiabilidad en drivers variados:

```bash
netsh wlan show networks
netsh wlan show networks mode=bssid
netsh wlan show interfaces
```

Regla practica:
- Si `netsh wlan show networks` devuelve 1 red, NetSentinel no puede "inventarse" mas redes sin modo monitor.

### 9.2 Caso real: `mode=bssid` no devuelve BSSID/canal/señal
En algunos equipos, `netsh wlan show networks mode=bssid` puede listar SSIDs y seguridad pero omitir:
- BSSID,
- canal,
- señal/RSSI.

Esto sucede por privacidad, driver o cache de escaneo.

Solucion implementada:
- Parseo de `show networks mode=bssid` (cuando hay BSSID).
- Si no hay BSSID, se crea un identificador estable (pseudo-BSSID) para poder dibujar el nodo sin jitter.
- Se enriquece el registro con `netsh wlan show interfaces` (red conectada) para obtener:
  - `AP BSSID`,
  - `Canal`,
  - `Rssi` real.

Detalles de implementacion:
- Fuente Windows: `src-tauri/src/infrastructure/wifi/windows_netsh/*` (parser + trigger best-effort).
- Orquestador: `src-tauri/src/infrastructure/wifi/windows_netsh.rs` y `src-tauri/src/infrastructure/wifi/wifi_scanner.rs`.

### 9.3 "Al entrar en Configuracion > Red e Internet ahora salen todas"
Es posible que al abrir el panel de redes de Windows se fuerce un nuevo escaneo o se refresque el cache de redes visibles.
Esto puede hacer que `netsh` pase de devolver 1 red a devolver varias.

Recomendaciones de operacion (sin tocar codigo):
1. Abrir el selector de redes WiFi de Windows y comprobar si aparecen mas redes.
2. Activar/Desactivar WiFi (o Modo avion) para forzar reescaneo.
3. Verificar que la ubicacion esta permitida (Windows puede bloquear el escaneo de WiFi sin permiso).
4. Revisar la configuracion del adaptador/driver (banda preferida, roaming aggressiveness).

## 10. Que significa "NODE INTEL" (CH, bandas, riesgo, etc.)
`NODE INTEL` es el panel de analisis del Radar. Su objetivo es que un alumno entienda el espectro como superficie de ataque fisica, sin depender de listas planas.

### 10.1 Riesgo (ALL / HARDENED / STANDARD / LEGACY / OPEN)
Clasifica el target segun la seguridad observada (inferencia defensiva):
- `HARDENED`: WPA3 o configuracion robusta.
- `STANDARD`: WPA2-Personal tipico.
- `LEGACY`: WEP o configuraciones heredadas.
- `OPEN`: red abierta.

Uso:
- Filtra por `LEGACY/OPEN` para ejercicios de hardening y concienciacion (sin ataque real).

### 10.2 Bandas (ALLGHz / 2.4GHz / 5GHz / UNKGHz)
Como la frecuencia real no siempre esta disponible en todas las APIs, el Radar infiere banda por canal:
- `2.4GHz`: canales 1..14
- `5GHz`: canales 32..177
- `UNKGHz`: desconocida (datos incompletos del SO/driver)

Uso:
- Filtrar `2.4GHz` para ver entornos saturados (muchas redes se concentran ahi).
- `UNKGHz` indica que el sistema no ha expuesto canal/banda de forma fiable.

### 10.3 Canal (CH:ALL)
Filtro rapido por canal cuando el dato esta disponible.

Uso:
- Detectar solapamientos (muchos SSIDs en el mismo canal).
- Evaluar congestión y potencial de interferencia.

### 10.4 Busqueda (SSID/vendor/BSSID)
Filtra por:
- SSID,
- vendor (si se resuelve por OUI),
- BSSID.

Uso:
- Encontrar un AP concreto o un fabricante (por ejemplo, IoT recurrente).

### 10.5 Auto (AUTO)
Reescaneo periodico (sin solapar scans) para observar variaciones de señal.

Uso:
- Simular "conciencia situacional": moverte con el portatil y ver cambios en RSSI/distancia.
