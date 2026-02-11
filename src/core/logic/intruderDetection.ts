import { DeviceDTO, ScanSession } from "../../shared/dtos/NetworkDTOs";

/**
 * Compara el escaneo actual con la ultima sesion conocida.
 * Devuelve una lista de IPs nuevas (no presentes en el historial reciente).
 */
export const detectIntruders = (
  currentScan: DeviceDTO[], 
  history: ScanSession[]
): string[] => {
  // Si no hay historial, no marcamos intrusos para evitar falso positivo inicial.
  if (!history || history.length === 0) {
    return [];
  }

  // Tomamos la sesion mas reciente (historial descendente).
  const lastSession = history[0];
  
  // Set para lookup O(1) de IPs conocidas.
  const knownIps = new Set(lastSession.devices.map(d => d.ip));

  // Filtrado de dispositivos nuevos respecto al ultimo snapshot.
  const intruderIps = currentScan
    .filter(device => !knownIps.has(device.ip))
    .map(device => device.ip);

  return intruderIps;
};
