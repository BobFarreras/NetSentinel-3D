import { useState, useEffect, useRef, useCallback } from 'react';
import { TrafficPacket } from '../../../shared/dtos/NetworkDTOs';
import { invokeCommand, listenEvent } from '../../../shared/tauri/bridge';

export interface UITrafficPacket extends TrafficPacket {
  _uiId: string;
  _seq: number;
}

export const useTrafficMonitor = () => {
  const [isActive, setIsActive] = useState(false);
  // Estado que contiene las listas consumidas por la UI
  const [data, setData] = useState<{
      all: UITrafficPacket[], 
      jammed: UITrafficPacket[]
  }>({ all: [], jammed: [] });
  
  const [speed, setSpeed] = useState(0); 
  
  // 1) Buffer principal de trafico
  const bufferRef = useRef<UITrafficPacket[]>([]);
  // 2) Buffer seguro de paquetes interceptados
  const jammedBufferRef = useRef<UITrafficPacket[]>([]);
  
  const byteCountRef = useRef(0);
  const seqRef = useRef(0);

  const toggleMonitoring = async () => {
    try {
      if (isActive) {
        await invokeCommand('stop_traffic_sniffing');
        setIsActive(false);
      } else {
        // Reset completo al arrancar monitor
        bufferRef.current = [];
        jammedBufferRef.current = [];
        setData({ all: [], jammed: [] });
        seqRef.current = 0; 
        await invokeCommand('start_traffic_sniffing');
        setIsActive(true);
      }
    } catch (e) {
      console.error(e);
      setIsActive(false);
    }
  };

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      unlisten = await listenEvent<TrafficPacket>('traffic-event', (event) => {
        seqRef.current++;
        
        const newPacket: UITrafficPacket = {
            ...event.payload,
            _uiId: `pkt-${seqRef.current}-${Math.random().toString(36).substr(2, 5)}`,
            _seq: seqRef.current
        };

        // A) Se inserta al inicio para mostrar lo mas reciente arriba
        bufferRef.current.unshift(newPacket);
        
        // B) Si el paquete fue interceptado, se conserva en lista jammed
        if (newPacket.isIntercepted) {
            jammedBufferRef.current.unshift(newPacket);
            // Limite defensivo para evitar crecimiento no acotado
            if (jammedBufferRef.current.length > 1000) {
                jammedBufferRef.current = jammedBufferRef.current.slice(0, 1000);
            }
        }

        byteCountRef.current += event.payload.length;

        // C) Limite principal de historial en vivo
        if (bufferRef.current.length > 5000) {
          bufferRef.current = bufferRef.current.slice(0, 5000);
        }
      });
    };

    setup();

    // Refresco de UI cada 200ms para reducir renders
    const interval = setInterval(() => {
        if (isActive || bufferRef.current.length > 0) {
            setSpeed(byteCountRef.current * 5);
            byteCountRef.current = 0;
            
            // Se publica snapshot de ambas listas
            setData({
                all: [...bufferRef.current],
                jammed: [...jammedBufferRef.current]
            });
        }
    }, 200);

    return () => {
      if (unlisten) unlisten();
      clearInterval(interval);
    };
  }, [isActive]);

  const clearPackets = useCallback(() => {
    bufferRef.current = [];
    jammedBufferRef.current = [];
    setData({ all: [], jammed: [] });
    setSpeed(0);
    seqRef.current = 0;
  }, []);
  
  // Retorno del estado de trafico para la UI
  return { isActive, packets: data.all, jammedPackets: data.jammed, speed, toggleMonitoring, clearPackets };
};
