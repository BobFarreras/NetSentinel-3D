import React from 'react';
import { TrafficPacket, DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

interface TrafficPanelProps {
  isActive: boolean;
  speed: number;
  packets: TrafficPacket[];
  devices: DeviceDTO[];
  onToggle: () => void;
  compactMode?: boolean;
}

export const TrafficPanel: React.FC<TrafficPanelProps> = ({ isActive, packets, devices, compactMode = false }) => {
  
  const resolveName = (ip: string) => {
      const device = devices.find(d => d.ip === ip);
      // Retallem el nom si és massa llarg per a la columna
      if (device) {
          const name = device.hostname && device.hostname !== "Unknown" ? `💻 ${device.hostname}` : `📱 ${device.vendor}`;
          return name;
      }
      if (ip === "255.255.255.255") return "📢 BROADCAST";
      if (ip.startsWith("224.0") || ip.startsWith("239.")) return "📡 MULTICAST";
      if (ip === "8.8.8.8") return "🔍 GOOGLE DNS";
      return ip;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* CAPÇALERA DE LA TAULA (Labels) */}
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '40px 1fr 20px 1fr 180px', // 👈 GRID MÀGIC: Columnes fixes
          gap: '10px', 
          padding: '5px 0', 
          borderBottom: '1px solid #333',
          color: '#444', fontWeight: 'bold', fontSize: '0.7rem'
      }}>
          <span>PROT</span>
          <span>SOURCE</span>
          <span></span>
          <span>DESTINATION</span>
          <span style={{textAlign: 'right'}}>INFO</span>
      </div>

      {/* LLISTA DE PAQUETS */}
      <div style={{ 
        flex: 1, overflowY: 'auto', background: '#050505', 
        paddingRight: '5px', // Espai per no tapar el text amb el scrollbar
        fontFamily: 'monospace', fontSize: '0.75rem' 
      }}>
        {packets.length === 0 ? (
          <div style={{ color: '#444', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
            {isActive ? 'Scanning neural network...' : 'Monitor offline.'}
          </div>
        ) : (
          packets.map((pkt) => {
            const srcName = resolveName(pkt.sourceIp);
            const dstName = resolveName(pkt.destinationIp);
            const isLocal = srcName.includes('📱') || srcName.includes('💻');

            return (
              <div key={pkt.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 1fr 20px 1fr 180px', // 👈 MATEIX GRID QUE AL HEADER
                gap: '10px', 
                padding: '3px 0', 
                borderBottom: '1px solid #111',
                alignItems: 'center',
                color: pkt.protocol === 'TCP' ? '#aaaaff' : pkt.protocol === 'UDP' ? '#ffffaa' : '#888'
              }}>
                <span style={{ fontWeight: 'bold' }}>{pkt.protocol}</span>
                
                {/* ORIGEN */}
                <span style={{ 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: isLocal ? '#0f0' : '#aaa' 
                }} title={pkt.sourceIp}>{srcName}</span>
                
                <span style={{ color: '#444', fontSize: '0.7rem' }}>▶</span>
                
                {/* DESTÍ */}
                <span style={{ 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: dstName.includes('DNS') ? '#0ff' : '#ddd' 
                }} title={pkt.destinationIp}>{dstName}</span>
                
                {/* INFO */}
                <span style={{ 
                    color: '#fff', opacity: 0.6, textAlign: 'right', 
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }} title={pkt.info}>
                    {pkt.info}
                </span>
              </div>
            );
          })
        )}
        {/* Div invisible al final per a l'autoscroll si el programessim */}
        <div style={{ float:"left", clear: "both" }}></div>
      </div>
    </div>
  );
};