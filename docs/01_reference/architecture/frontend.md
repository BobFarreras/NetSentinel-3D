<!-- docs/01_reference/architecture/frontend.md -->
<!-- Descripcion: arquitectura del frontend (React) por carpetas, responsabilidades y puntos de entrada. -->

# Frontend (UI)

## 1) Regla principal
El frontend NO hace red/sistema. El frontend:
- pinta la UI,
- gestiona estado,
- y llama al backend via IPC (Tauri).

## 2) Donde esta cada cosa
- Features (paneles): `src/ui/features/*`
  - cada feature tiene `README.md` dentro.
- Layout (dock / ventanas): `src/ui/components/layout/*`
- Hooks compartidos: `src/ui/hooks/modules/*`
- Logica pura (helpers): `src/core/logic/*`
- IPC adapters: `src/adapters/*`

## 3) “Quien manda” en el frontend
Orquestador principal:
- `src/ui/hooks/useNetworkManager.ts`

Piensa en el como “director de orquesta”:
- decide que se selecciona,
- cuando se escanea,
- y como se combinan resultados (scan/audit/router sync).

## 4) Patron (para no crear GOD files)
Para cada panel:
- `Panel.tsx`: composicion (UI)
- `usePanelState.ts`: estado/efectos/handlers
- `panel/*`: subcomponentes puros

## 5) Tests en frontend
- Unit tests de hooks: `src/ui/hooks/modules/__tests__/*`
- Integracion: `src/__tests__/*`

