import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { NetworkNode } from './NetworkNode';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';

interface NetworkSceneProps {
  devices?: DeviceDTO[];
  onDeviceSelect?: (device: DeviceDTO | null) => void;
  selectedIp?: string | null;
}

export const NetworkScene: React.FC<NetworkSceneProps> = ({ 
  devices = [], 
  onDeviceSelect,
  selectedIp 
}) => {
  
  const { centerNode, orbitingNodes } = useMemo(() => {
    // 1. Busquem el Router (Gateway)
    const gateway = devices.find(d => d.ip.endsWith('.1') || d.isGateway);
    
    // 2. La resta són els altres
    const others = devices.filter(d => !d.ip.endsWith('.1') && !d.isGateway);

    return {
      centerNode: gateway,
      orbitingNodes: others 
    };
  }, [devices]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000' }}>
      <Canvas 
        camera={{ position: [0, 10, 15], fov: 60 }} 
        onPointerMissed={() => onDeviceSelect && onDeviceSelect(null)}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        {/* Fons d'estrelles */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* 🌞 CENTRE: EL ROUTER (GATEWAY) - BLAU */}
        {centerNode ? (
          <>
            <NetworkNode 
              position={[0, 0, 0]} 
              color="#0088ff" 
              name={`ROUTER (${centerNode.ip})`}
              onClick={() => onDeviceSelect && onDeviceSelect(centerNode)}
              isSelected={selectedIp === centerNode.ip}
            />
            {/* Anell del Router */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.6, 64]} />
              <meshBasicMaterial color="#004488" transparent opacity={0.5} />
            </mesh>
          </>
        ) : (
          <NetworkNode position={[0, 0, 0]} color="#333333" name="SEARCHING GATEWAY..." />
        )}

        {/* 🪐 ÒRBITA: TOTES LES AMENACES + TU */}
        {orbitingNodes.map((device, index) => {
          const totalNodes = orbitingNodes.length;
          const radius = 8;
          const angle = (index / totalNodes) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          // 🔥 LÒGICA DE COLORS
          let nodeColor = "#ff0000"; // PER DEFECTE: VERMELL (AMENAÇA)

          // 1. SI SÓC JO (VERD)
          if (device.vendor.includes('NETSENTINEL') || device.vendor.includes('(ME)') || device.mac === "00:00:00:00:00:00") {
            nodeColor = "#00ff00"; 
          }
          // 2. SI TÉ WIFI (MAGENTA) - Per diferenciar del router blau
          else if (device.wifi_band || device.signal_strength) {
            nodeColor = "#ff00ff"; 
          }

          return (
            <NetworkNode 
              key={device.ip + index} 
              position={[x, 0, z]} 
              color={nodeColor} 
              name={device.ip}
              onClick={() => onDeviceSelect && onDeviceSelect(device)}
              isSelected={selectedIp === device.ip}
            />
          );
        })}

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={!selectedIp} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};