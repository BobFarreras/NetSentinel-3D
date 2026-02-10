import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TrafficPacket, DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

// Interfaz de paquete para capa UI
interface UITrafficPacket extends TrafficPacket {
  _uiId?: string;
  _seq?: number;
}

interface TrafficPanelProps {
  isActive: boolean;
  speed: number;
  packets: UITrafficPacket[];        // Llista general (5000)
  jammedPackets?: UITrafficPacket[]; // Llista segura (Atacs permanents)
  devices: DeviceDTO[];
  selectedDevice?: DeviceDTO | null;
  onClear?: () => void;
  onToggle?: () => void;
  compactMode?: boolean;
}

type FilterMode = 'ALL' | 'JAMMED' | 'TARGET';

export const TrafficPanel: React.FC<TrafficPanelProps> = ({ 
    isActive, packets, jammedPackets = [], devices, selectedDevice, onClear 
}) => {
  
  const [filterMode, setFilterMode] = useState<FilterMode>('ALL');
  const [visibleLimit, setVisibleLimit] = useState(50); // Carga inicial de filas
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset al cambiar dispositivo objetivo
  useEffect(() => {
    if (selectedDevice) setFilterMode('TARGET');
    else setFilterMode('ALL');
    setVisibleLimit(50);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [selectedDevice]);

  const handleFilterChange = (mode: FilterMode) => {
      setFilterMode(mode);
      setVisibleLimit(50);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  };

  // Deteccion de scroll para cargar mas filas
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      // Carga progresiva al acercarse al final
      if (scrollHeight - scrollTop <= clientHeight + 50) {
          setVisibleLimit(prev => prev + 50);
      }
  };

  const resolveName = (ip: string) => {
    const device = devices.find(d => d.ip === ip);
    if (device) return device.hostname && device.hostname !== "Unknown" ? `💻 ${device.hostname}` : `📱 ${device.vendor}`;
    if (ip === "255.255.255.255") return "📢 BROADCAST";
    if (ip.startsWith("224.0") || ip.startsWith("239.")) return "📡 MULTICAST";
    if (ip === "8.8.8.8") return "🔍 GOOGLE DNS";
    return ip;
  };

  // 1) Seleccion de fuente de datos (general o jammed)
  const sourcePackets = useMemo(() => {
      if (filterMode === 'JAMMED') return jammedPackets;
      return packets;
  }, [packets, jammedPackets, filterMode]);

  // 2) Filtro por modo seleccionado
  const filteredPackets = useMemo(() => {
    let filtered = sourcePackets;
    
    if (filterMode === 'TARGET') {
        if (selectedDevice) {
            filtered = sourcePackets.filter(p => p.sourceIp === selectedDevice.ip || p.destinationIp === selectedDevice.ip);
        }
    }
    return filtered;
  }, [sourcePackets, filterMode, selectedDevice]);

  // 3) Paginacion incremental
  const visiblePackets = useMemo(() => {
      return filteredPackets.slice(0, visibleLimit);
  }, [filteredPackets, visibleLimit]);

  const targetLabel = useMemo(() => {
    if (!selectedDevice) return '🎯 TARGET';
    const vendor = selectedDevice.vendor?.trim();
    if (vendor && vendor.toLowerCase() !== 'unknown') return `🎯 ${vendor}`;
    const hostname = selectedDevice.hostname?.trim();
    if (hostname && hostname.toLowerCase() !== 'unknown') return `🎯 ${hostname}`;
    return `🎯 ${selectedDevice.ip}`;
  }, [selectedDevice]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#050505', overflow: 'hidden' }}>
      
      {/* Cabecera de filtros */}
      <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px', borderBottom: '1px solid #004400', background: '#020202', flexShrink: 0
      }}>
          <div style={{ display: 'flex', gap: '5px' }}>
              <FilterBtn label={`ALL (${packets.length})`} active={filterMode === 'ALL'} onClick={() => handleFilterChange('ALL')} />
              {/* Contador real de paquetes interceptados */}
              <FilterBtn label={`💀 JAMMED (${jammedPackets.length})`} active={filterMode === 'JAMMED'} onClick={() => handleFilterChange('JAMMED')} color="#ff5555" />
              <FilterBtn 
                label={targetLabel} 
                active={filterMode === 'TARGET'} 
                onClick={() => handleFilterChange('TARGET')} 
                disabled={!selectedDevice} 
                color="#ffff00"
              />
          </div>

          <div style={{display:'flex', gap: 10, alignItems:'center'}}>
            {onClear && (
                <button onClick={onClear} style={{
                    background: '#440000', border: '1px solid #ff3333', color: '#ffcccc',
                    cursor: 'pointer', fontSize: '0.65rem', padding: '2px 8px', fontWeight: 'bold', fontFamily: 'monospace'
                }}>🗑️ CLR</button>
            )}
          </div>
      </div>

      {/* Cabecera de columnas */}
      <div style={{ 
          display: 'grid', gridTemplateColumns: '45px 1fr 15px 1fr 100px', 
          gap: '5px', padding: '4px 0', borderBottom: '1px solid #222',
          color: '#008800', fontWeight: 'bold', fontSize: '0.65rem', background: '#080808'
      }}>
          <span style={{paddingLeft: 5}}>TYPE</span>
          <span>SRC</span>
          <span></span>
          <span>DST</span>
          <span style={{textAlign: 'right', paddingRight: 5}}>DATA</span>
      </div>

      {/* Lista con scroll */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '2px' }}
      >
        {visiblePackets.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#444', fontSize: '0.7rem', fontFamily: 'monospace' }}>
             {isActive ? 'WAITING FOR TRAFFIC...' : 'MONITOR PAUSED'}
             <div style={{marginTop: 5, fontSize: '0.6rem'}}>Filter: {filterMode}</div>
             {filterMode === 'JAMMED' && <div style={{color: '#633', marginTop: 10}}>No attacks detected yet.</div>}
          </div>
        ) : (
          visiblePackets.map((pkt, idx) => {
            const isBlocked = pkt.isIntercepted;
            const uniqueKey = pkt._uiId || `${pkt.id}-${idx}`;

            return (
              <div key={uniqueKey} style={{ 
                display: 'grid', gridTemplateColumns: '45px 1fr 15px 1fr 100px',
                gap: '5px', padding: '3px 0', borderBottom: '1px solid #111',
                alignItems: 'center', fontFamily: "'Consolas', monospace", fontSize: '0.7rem',
                backgroundColor: isBlocked ? 'rgba(100, 0, 0, 0.2)' : 'transparent',
                color: isBlocked ? '#ff5555' : (pkt.protocol === 'TCP' ? '#8f8' : '#ff8'),
                // Animamos solo las primeras filas para evitar coste extra
                animation: idx < 3 ? 'flashNew 0.5s ease-out' : 'none'
              }}>
                <style>{`
                  @keyframes flashNew {
                    0% { background-color: rgba(0, 255, 0, 0.2); transform: translateX(-5px); }
                    100% { background-color: transparent; transform: translateX(0); }
                  }
                `}</style>
                <span style={{ fontWeight: 'bold', paddingLeft: 5 }}>{isBlocked ? 'BLK' : pkt.protocol}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resolveName(pkt.sourceIp)}</span>
                <span style={{ color: '#444', fontSize: '0.6rem' }}>▶</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: isBlocked ? 'line-through' : 'none', opacity: isBlocked ? 0.6 : 1 }}>{resolveName(pkt.destinationIp)}</span>
                <span style={{ textAlign: 'right', paddingRight: 5, whiteSpace: 'nowrap', overflow: 'hidden', opacity: 0.7 }}>{pkt.info}</span>
              </div>
            );
          })
        )}
        
        {/* Indicadores de estado de buffer */}
        {visibleLimit < filteredPackets.length ? (
            <div style={{textAlign: 'center', padding: 10, color: '#004400', fontSize: '0.7rem'}}>
                ... SCROLL TO LOAD MORE ...
            </div>
        ) : (
            filteredPackets.length > 0 && (
                <div style={{textAlign: 'center', padding: 10, color: '#440000', fontSize: '0.7rem', borderTop: '1px solid #330000'}}>
                    --- END OF BUFFER ({filteredPackets.length}) ---
                </div>
            )
        )}
      </div>
    </div>
  );
};

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

const FilterBtn: React.FC<FilterBtnProps> = ({ label, active, onClick, color = '#00ff00', disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
        background: active ? `${color}22` : 'transparent',
        border: `1px solid ${active ? color : '#333'}`,
        color: disabled ? '#333' : (active ? color : '#666'),
        fontSize: '0.65rem', padding: '2px 6px', cursor: disabled ? 'not-allowed' : 'pointer',
        marginRight: '4px', fontWeight: 'bold', fontFamily: 'monospace'
    }}>{label}</button>
);
