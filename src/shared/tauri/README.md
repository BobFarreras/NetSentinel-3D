<!-- Ruta: src/shared/tauri/README.md -->
<!-- Descripcion: documenta el bridge IPC (frontend <-> backend Tauri) y el modo E2E mock. -->

# Tauri Bridge (Frontend <-> Backend)

Esta carpeta es el **punto de union** entre el frontend (React/TypeScript) y el backend (Rust/Tauri).

Piensalo asi (modo junior):
- UI = la pantalla.
- Adapter = la parte de la UI que llama a “comandos” (telefonito).
- Bridge = el “cable” que realmente hace la llamada.
- Backend = el motor (Rust) que ejecuta red/sistema.

## Fuente de verdad

- Bridge: `src/shared/tauri/bridge.ts`
  - Exporta:
    - `invokeCommand<T>(command, args?)`
    - `listenEvent<T>(eventName, callback)`

Los adapters del frontend solo deberían usar **estas dos funciones** para hablar con Tauri:
- `src/adapters/*Adapter.ts`

## Que hace `bridge.ts`

1. En runtime normal:
   - `invokeCommand` llama a `@tauri-apps/api/core.invoke`
   - `listenEvent` llama a `@tauri-apps/api/event.listen`
2. En modo E2E mock (sin backend real):
   - si `VITE_E2E_MOCK_TAURI === 'true'`
   - `invokeCommand` y `listenEvent` delegan a un runtime mock local

## E2E mock (por que existe)

El mock sirve para correr UI/E2E sin depender de:
- permisos del SO,
- drivers,
- red real,
- o procesos del backend.

Codigo:
- `src/shared/tauri/e2e_mock/*`
  - `invokeMock.ts`: tabla de comandos simulados (`switch(command)`).
  - `mockBus.ts`: bus de eventos simulado (equivalente a `listen/emit`).

Regla:
- El mock NO es “bridge”. Es un simulador. Por eso vive separado.

## Contratos (DTOs)

Los tipos que viajan entre frontend y backend estan aqui:
- `src/shared/dtos/NetworkDTOs.ts`

Regla:
- Si cambias un DTO en Rust, actualiza el espejo TS en el mismo cambio.

