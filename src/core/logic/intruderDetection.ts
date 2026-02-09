import { DeviceDTO, ScanSession } from "../../shared/dtos/NetworkDTOs";

/**
 * Compara l'escaneig actual amb l'última sessió coneguda.
 * Retorna una llista d'IPs que són NOVES (no estaven abans).
 */
export const detectIntruders = (
  currentScan: DeviceDTO[], 
  history: ScanSession[]
): string[] => {
  // 1. Si no hi ha històric, tècnicament tot és nou, 
  // però per no espantar l'usuari la primera vegada, retornem buit.
  if (!history || history.length === 0) {
    return [];
  }

  // 2. Agafem l'última sessió (assumim que està ordenada per data descendent)
  const lastSession = history[0]; // La més recent
  
  // 3. Creem un Set d'IPs conegudes per cerca ràpida O(1)
  const knownIps = new Set(lastSession.devices.map(d => d.ip));

  // 4. Filtrem: Quins dispositius actuals NO estan al Set conegut?
  const intruderIps = currentScan
    .filter(device => !knownIps.has(device.ip))
    .map(device => device.ip);

  if (intruderIps.length > 0) {
    console.log("🚨 INTRUDERS DETECTED:", intruderIps);
  }

  return intruderIps;
};