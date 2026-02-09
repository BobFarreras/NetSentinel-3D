import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { NetworkNode } from './NetworkNode';
import { DeviceDTO } from '../../../shared/dtos/NetworkDTOs';
import * as THREE from 'three';

interface NetworkSceneProps {
  devices?: DeviceDTO[];
  onDeviceSelect?: (device: DeviceDTO | null) => void;
  selectedIp?: string | null;
  intruders?: string[];
}

const AlarmRing = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      const t = state.clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 5) * 0.2;
      ringRef.current.scale.set(scale, scale, 1);
      
      if (Array.isArray(ringRef.current.material)) return;
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 5) * 0.5;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
};

export const NetworkScene: React.FC<NetworkSceneProps> = ({ 
  devices = [], 
  onDeviceSelect,
  selectedIp,
  intruders = [] 
}) => {
  
  const { centerNode, orbitingNodes } = useMemo(() => {
    const gateway = devices.find(d => d.ip.endsWith('.1') || d.isGateway);
    const others = devices.filter(d => !d.ip.endsWith('.1') && !d.isGateway);
    return { centerNode: gateway, orbitingNodes: others };
  }, [devices]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#000000' }}>
      <Canvas 
        camera={{ position: [0, 10, 15], fov: 60 }} 
        onPointerMissed={() => onDeviceSelect && onDeviceSelect(null)}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* 🌞 CENTRE: EL ROUTER (GATEWAY) */}
        {centerNode ? (
          <group position={[0, 0, 0]}>
            <NetworkNode 
              position={[0, 0, 0]} 
              color="#0088ff" 
              name={`ROUTER (${centerNode.ip})`}
              onClick={() => onDeviceSelect && onDeviceSelect(centerNode)}
              isSelected={selectedIp === centerNode.ip}
            />
            {/* Anell estàtic del router */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.6, 64]} />
              <meshBasicMaterial color="#004488" transparent opacity={0.3} />
            </mesh>
          </group>
        ) : (
          <NetworkNode position={[0, 0, 0]} color="#333333" name="SEARCHING GATEWAY..." />
        )}

        {/* 🪐 ÒRBITA: DISPOSITIUS */}
        {orbitingNodes.map((device, index) => {
          const totalNodes = orbitingNodes.length;
          const radius = 8;
          const angle = (index / totalNodes) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          // 🔥 LÒGICA DE COLORS
          let nodeColor = "#ff4444"; // PER DEFECTE: VERMELL (Hostil/Desconegut)

          const isIntruder = intruders.includes(device.ip);
          const isMe = device.vendor.includes('NETSENTINEL') || device.vendor.includes('(ME)') || device.mac === "00:00:00:00:00:00";
          const hasWifiData = device.wifi_band || device.signal_strength;

          if (isMe) {
            nodeColor = "#00ff00"; // 🟢 JO
          } else if (isIntruder) {
            nodeColor = "#ff0000"; // 🚨 INTRÚS (Més brillant + Anell)
          } else if (hasWifiData) {
            nodeColor = "#ff00ff"; // 🟣 WIFI
          }

          return (
            <group position={[x, 0, z]} key={device.ip}>
              <NetworkNode 
                position={[0, 0, 0]} 
                color={nodeColor} 
                name={device.ip}
                onClick={() => onDeviceSelect && onDeviceSelect(device)}
                isSelected={selectedIp === device.ip}
              />
              
              {/* 🚨 SI ÉS INTRÚS: AFEGIM ANELL D'ALARMA */}
              {isIntruder && <AlarmRing />}
            </group>
          );
        })}

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={!selectedIp} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};