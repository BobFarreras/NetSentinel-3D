import { useState, useEffect, useRef, useCallback } from 'react';
import { TrafficPacket } from '../../../shared/dtos/NetworkDTOs';
import { invokeCommand, listenEvent } from '../../../shared/tauri/bridge';

export interface UITrafficPacket extends TrafficPacket {
  _uiId: string;
  _seq: number;
}

export const useTrafficMonitor = () => {
  const [isActive, setIsActive] = useState(false);
  // Estat que conté TOTES les llistes necessàries
  const [data, setData] = useState<{
      all: UITrafficPacket[], 
      jammed: UITrafficPacket[]
  }>({ all: [], jammed: [] });
  
  const [speed, setSpeed] = useState(0); 
  
  // 1. BUFFER PRINCIPAL (Trànsit viu, rota ràpid)
  const bufferRef = useRef<UITrafficPacket[]>([]);
  // 2. BUFFER SEGUR (Només atacs, NO s'esborra pel trànsit normal)
  const jammedBufferRef = useRef<UITrafficPacket[]>([]);
  
  const byteCountRef = useRef(0);
  const seqRef = useRef(0);

  const toggleMonitoring = async () => {
    try {
      if (isActive) {
        await invokeCommand('stop_traffic_sniffing');
        setIsActive(false);
      } else {
        // RESET TOTAL
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

        // A. AFEGIM AL BUFFER PRINCIPAL (Dalt de tot)
        bufferRef.current.unshift(newPacket);
        
        // B. SI ÉS UN ATAC, EL GUARDEM A LA CAIXA FORTA
        if (newPacket.isIntercepted) {
            jammedBufferRef.current.unshift(newPacket);
            // Limitem els atacs a 1000 per si de cas, però és difícil omplir-ho
            if (jammedBufferRef.current.length > 1000) {
                jammedBufferRef.current = jammedBufferRef.current.slice(0, 1000);
            }
        }

        byteCountRef.current += event.payload.length;

        // C. LIMIT PRINCIPAL (5000 PAQUETS)
        // Això dóna molt marge per fer scroll abans que s'esborrin
        if (bufferRef.current.length > 5000) {
          bufferRef.current = bufferRef.current.slice(0, 5000);
        }
      });
    };

    setup();

    // Loop de refresc UI (200ms)
    const interval = setInterval(() => {
        if (isActive || bufferRef.current.length > 0) {
            setSpeed(byteCountRef.current * 5);
            byteCountRef.current = 0;
            
            // Passem les DUES llistes a la UI
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
  
  // Retornem l'objecte 'packets' però ara conté les dues llistes
  return { isActive, packets: data.all, jammedPackets: data.jammed, speed, toggleMonitoring, clearPackets };
};
