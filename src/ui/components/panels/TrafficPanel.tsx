import React from 'react';
import { TrafficPacket, DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

interface TrafficPanelProps {
  isActive: boolean;
  speed: number;
  packets: TrafficPacket[];
  devices: DeviceDTO[]; // 👈 AFEGIT: Necessitem saber qui són els dispositius
  onToggle: () => void;
}

export const TrafficPanel: React.FC<TrafficPanelProps> = ({ isActive, speed, packets, devices, onToggle }) => {
  
  // FUNCIÓ DE TRADUCCIÓ: IP -> NOM HUMÀ
  const resolveName = (ip: string) => {
    // 1. Busquem si és un dispositiu conegut del nostre escàner
    const device = devices.find(d => d.ip === ip);
    if (device) {
        // Retornem el Vendor o el Hostname si el tenim
        return device.hostname && device.hostname !== "Unknown" 
            ? `💻 ${device.hostname}` 
            : `📱 ${device.vendor} (.${ip.split('.').pop()})`;
    }

    // 2. Adreces especials
    if (ip === "255.255.255.255") return "📢 TOTS (Broadcast)";
    if (ip.startsWith("224.0") || ip.startsWith("239.")) return "📡 MULTICAST (IoT)";
    if (ip === "8.8.8.8") return "🔍 GOOGLE DNS";

    // 3. Si és externa, la deixem igual però més discreta
    return ip;
  };

  const formatSpeed = (bytes: number) => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB/s`;
    if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${bytes} B/s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      
      {/* HEADER ... (igual que abans) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button 
          onClick={onToggle}
          style={{
            background: isActive ? '#440000' : '#004400',
            color: isActive ? '#ff8888' : '#88ff88',
            border: `1px solid ${isActive ? '#ff0000' : '#00ff00'}`,
            padding: '5px 15px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold'
          }}
        >
          {isActive ? '⏹ STOP MONITOR' : '▶ START LIVE MONITOR'}
        </button>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: '#888' }}>NET SPEED</div>
          <div style={{ fontSize: '1.2rem', color: '#00ffff', fontFamily: 'monospace', textShadow: '0 0 10px #00ffff' }}>
            {formatSpeed(speed)}
          </div>
        </div>
      </div>

      {/* LLISTA DE PAQUETS HUMANA */}
      <div style={{ 
        flex: 1, overflowY: 'auto', background: '#050505', 
        border: '1px solid #222', padding: '5px', fontFamily: 'monospace', fontSize: '0.8rem' 
      }}>
        {packets.length === 0 ? (
          <div style={{ color: '#444', textAlign: 'center', marginTop: '20px' }}>
            {isActive ? 'Analyzing traffic patterns...' : 'Monitor offline.'}
          </div>
        ) : (
          packets.map((pkt) => {
            // Calculem noms
            const srcName = resolveName(pkt.sourceIp);
            const dstName = resolveName(pkt.destinationIp);
            
            // Color especial per trànsit local
            const isLocal = srcName.includes('📱') || srcName.includes('💻');

            return (
              <div key={pkt.id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '50px 1fr 20px 1fr 150px', // Grid per alinear bé
                gap: '10px', 
                padding: '4px 0', 
                borderBottom: '1px solid #111',
                alignItems: 'center',
                color: pkt.protocol === 'TCP' ? '#aaaaff' : pkt.protocol === 'UDP' ? '#ffffaa' : '#888'
              }}>
                <span style={{ fontWeight: 'bold', fontSize:'0.7rem' }}>{pkt.protocol}</span>
                
                {/* ORIGEN */}
                <span style={{ 
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    color: isLocal ? '#0f0' : '#aaa' 
                }}>
                    {srcName}
                </span>
                
                <span style={{ color: '#444' }}>&rarr;</span>
                
                {/* DESTÍ */}
                <span style={{ 
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    color: dstName.includes('DNS') ? '#0ff' : '#ddd'
                }}>
                    {dstName}
                </span>
                
                {/* INFO (Web Segura, etc) */}
                <span style={{ 
                    color: '#fff', opacity: 0.7, fontStyle: 'italic', fontSize: '0.75rem', 
                    textAlign: 'right', overflow:'hidden', whiteSpace:'nowrap' 
                }}>
                    {pkt.info}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};