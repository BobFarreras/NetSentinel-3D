<!-- docs/OPSEC_GHOST_MODE.md -->
<!-- Descripcion: documenta el flujo de Ghost Mode (randomize_mac), por que podia fallar en Windows y como lo hemos endurecido. -->

# OpSec: Ghost Mode (MAC Randomization)

## Sintoma
Al ejecutar **Enable Ghost Mode** desde `DeviceDetailPanel`, el panel mostraba:
- `IDENTITY SWAPPED SUCCESSFULLY!`
- `New Physical Address: ...`

Pero el MAC real **no cambiaba**, o se devolvia el **mismo** MAC anterior.

## Causa raiz
La implementacion inicial de `randomize_mac` en backend:
- Activaba el toggle nativo de Windows `WlanSvc` (Random Hardware Addresses) via registro (`RandomMacSourceObject`),
- Reiniciaba el adaptador,
- Leía `Get-NetAdapter.MacAddress` y devolvia ese valor.

Problemas de este enfoque:
- El toggle de `WlanSvc` **no garantiza** un cambio inmediato de MAC a nivel driver.
- En algunos drivers el valor puede:
  - tardar en aplicarse,
  - no aplicarse nunca,
  - o reutilizar el mismo MAC.
- Resultado: el comando podia devolver "SUCCESS" con una MAC que en realidad no habia cambiado.

## Solucion aplicada
Se cambio el backend para hacer un override explicito y verificable:
1. Leer el MAC actual (`oldMac`).
2. Generar un MAC aleatorio **unicast + locally administered (LAA)** distinto del actual.
3. Aplicar el override con `NetworkAddress`:
   - preferente: `Set-NetAdapterAdvancedProperty -RegistryKeyword NetworkAddress`
   - fallback: escritura directa en la clave del driver por `NetCfgInstanceId`.
4. Reiniciar el adaptador.
5. Hacer polling y **verificar** que `Get-NetAdapter.MacAddress` cambia.
6. Si no cambia, el comando falla con error claro (no devuelve un "SUCCESS" falso).

Archivo: `src-tauri/src/application/opsec/mac_changer.rs`.

## UX/Integracion UI
La UI actualiza el nodo host de forma optimista al recibir el resultado del comando:
- `DeviceDetailPanel` emite `netsentinel://ghost-mode-applied` con `{ hostIp, newMac }`.
- `useNetworkManager` escucha ese evento y actualiza el MAC del host en el inventario sin esperar a `get_identity`.

Esto evita una ventana de inconsistencia mientras el adaptador reinicia y `get_identity` tarda en estabilizarse.

## Notas y limites
- Algunos adaptadores/drivers no soportan `NetworkAddress`. En ese caso el comando falla y el panel mostrara el error.
- Cambiar MAC implica reconexion de red; es normal perder conectividad unos segundos.

