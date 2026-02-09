import { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TrafficPacket } from '../../../shared/dtos/NetworkDTOs';
import { invoke } from '@tauri-apps/api/core';

export const useTrafficMonitor = () => {
  const [isActive, setIsActive] = useState(false);
  const [packets, setPackets] = useState<TrafficPacket[]>([]);
  const [speed, setSpeed] = useState(0); // Bytes per segon
  const bufferRef = useRef<TrafficPacket[]>([]);
  const byteCountRef = useRef(0);

  // 1. INICIAR / ATURAR DES DEL FRONTEND
  const toggleMonitoring = async () => {
    try {
      if (isActive) {
        await invoke('stop_traffic_sniffing');
        setIsActive(false);
      } else {
        await invoke('start_traffic_sniffing');
        setIsActive(true);
      }
    } catch (e) {
      console.error("Failed to toggle sniffer:", e);
    }
  };

  // 2. ESCOLTAR EVENTS (OPTIMITZAT)
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setupListener = async () => {
      unlisten = await listen<TrafficPacket>('traffic-event', (event) => {
        // En lloc de fer setState (que és lent), guardem en una referència temporal
        bufferRef.current.unshift(event.payload); // Afegim al principi
        byteCountRef.current += event.payload.length;
        
        // Limitem el buffer a 50 paquets per no petar la memòria visual
        if (bufferRef.current.length > 50) {
          bufferRef.current = bufferRef.current.slice(0, 50);
        }
      });
    };

    setupListener();

    // 3. ACTUALITZAR UI CADA 500ms (THROTTLE)
    const interval = setInterval(() => {
      if (byteCountRef.current > 0 || bufferRef.current.length > 0) {
        setSpeed(byteCountRef.current * 2); // *2 perquè actualitzem cada 0.5s -> velocitat per segon
        setPackets([...bufferRef.current]); // Ara sí, actualitzem l'estat visual
        byteCountRef.current = 0; // Reiniciem comptador de velocitat
      } else {
          setSpeed(0);
      }
    }, 500);

    return () => {
      if (unlisten) unlisten();
      clearInterval(interval);
      invoke('stop_traffic_sniffing').catch(() => {}); // Assegurar parada al desmuntar
    };
  }, []);

  return {
    isActive,
    packets,
    speed,
    toggleMonitoring
  };
};