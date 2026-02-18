<!-- docs/01_reference/architecture/runtime_flows.md -->
<!-- Descripcion: flujos end-to-end (UI -> backend -> UI) de las features principales. -->

# Flujos runtime (recetas)

La idea: cada flujo es una receta de 6-8 pasos.

## 1) Scan de red
1. UI: el usuario pulsa SCAN.
2. Hook: `src/ui/hooks/useNetworkManager.ts` decide ejecutar el scan.
3. Adapter: llama `scan_network`.
4. Backend: comando `scan_network` ejecuta el caso de uso de scan.
5. Backend: devuelve `DeviceDTO[]`.
6. UI: actualiza inventario y renderiza nodos.

## 2) Audit de puertos (Device)
1. UI: selecciona un nodo y ejecuta “DEEP AUDIT”.
2. Adapter: llama `audit_target`.
3. Backend: ejecuta probe de puertos y analisis.
4. UI: pinta puertos en Device Detail.

## 3) Audit de gateway (Router)
1. UI: el usuario ejecuta auditoria de gateway.
2. Adapter: llama `audit_router` o `fetch_router_devices` (segun flujo).
3. Backend: intenta sync del router y parsea inventario.
4. UI: mergea inventario (y refresca labels).

## 4) Live Traffic
1. UI: pulsa START en LIVE TRAFFIC.
2. Adapter: llama `start_traffic_sniffing`.
3. Backend: inicia captura y emite `traffic-event`.
4. UI: escucha eventos y rellena tabla.
5. UI: al parar, llama `stop_traffic_sniffing`.

## 5) Attack Lab (LAB/CUSTOM)
Doc completo:
- `docs/02_guides/ATTACK_LAB.md`

