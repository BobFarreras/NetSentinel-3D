import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { NetworkNode } from './NetworkNode';
import { DeviceDTO, HostIdentity } from '../../../shared/dtos/NetworkDTOs';
import * as THREE from 'three';

interface NetworkSceneProps {
  devices?: DeviceDTO[];
  onDeviceSelect?: (device: DeviceDTO | null) => void;
  selectedIp?: string | null;
  intruders?: string[];
  identity?: HostIdentity | null;
}

// --- COMPONENT MÀGIC: CÀMERA AUTO-AJUSTABLE ---
const AutoFitCamera = ({ devices }: { devices: DeviceDTO[] }) => {
  // 🟢 FIX: Hem tret 'controls' del destructuring perquè no el fèiem servir
  const { camera } = useThree();
  
  // 🟢 FIX: Hem tret 'controlsRef'

  useEffect(() => {
    if (devices.length === 0) return;

    // Lògica simple: Si hi ha dispositius, ens allunyem per veure l'anella
    const TARGET_RADIUS = 12; 
    const VIEW_ANGLE = 45 * (Math.PI / 180);
    const requiredDistance = TARGET_RADIUS / Math.tan(VIEW_ANGLE / 2);
    
    // Posició Objectiu
    const newY = requiredDistance * 0.8; 
    const newZ = requiredDistance * 0.8;

    camera.position.set(0, newY, newZ);
    camera.lookAt(0, 0, 0);

  }, [devices.length, camera]); // Afegim camera a deps

  return null;
};

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
  intruders = [],
  identity = null,
}) => {
  
  const { centerNode, orbitingNodes } = useMemo(() => {
    const gateway = devices.find(d =>
      Boolean(d.isGateway) ||
      (identity?.gatewayIp ? d.ip === identity.gatewayIp : d.ip.endsWith('.1'))
    );
    const others = devices.filter(d =>
      !Boolean(d.isGateway) &&
      (identity?.gatewayIp ? d.ip !== identity.gatewayIp : !d.ip.endsWith('.1'))
    );
    return { centerNode: gateway, orbitingNodes: others };
  }, [devices, identity?.gatewayIp]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#000000' }}>
      <Canvas 
        camera={{ position: [0, 20, 25], fov: 50 }} 
        resize={{ scroll: false, debounce: 0 }} 
        style={{ background: '#050505' }}
        onPointerMissed={() => onDeviceSelect && onDeviceSelect(null)}
      >
        <AutoFitCamera devices={devices} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* 🌞 CENTRE */}
        {centerNode ? (
          <group position={[0, 0, 0]}>
            <NetworkNode 
              position={[0, 0, 0]} 
              color="#0088ff" 
              name={`ROUTER (${centerNode.ip})`}
              onClick={() => onDeviceSelect && onDeviceSelect(centerNode)}
              isSelected={selectedIp === centerNode.ip}
            />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.6, 64]} />
              <meshBasicMaterial color="#004488" transparent opacity={0.3} />
            </mesh>
          </group>
        ) : (
          <NetworkNode position={[0, 0, 0]} color="#333333" name="SEARCHING..." />
        )}

        {/* 🪐 ÒRBITA */}
        {orbitingNodes.map((device, index) => {
          const totalNodes = orbitingNodes.length;
          const radius = 10;
          const angle = (index / totalNodes) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          let nodeColor = "#ff4444"; 
          const isIntruder = intruders.includes(device.ip);
          const isMe = (identity?.ip ? device.ip === identity.ip : false) || device.vendor.includes('NETSENTINEL') || device.vendor.includes('(ME)');
          const hasWifiData = device.wifi_band || device.signal_strength;

          if (isMe) nodeColor = "#00ff00";
          else if (isIntruder) nodeColor = "#ff0000";
          else if (hasWifiData) nodeColor = "#ff00ff";

          return (
            <group position={[x, 0, z]} key={device.ip}>
              <NetworkNode 
                position={[0, 0, 0]} 
                color={nodeColor} 
                name={device.ip}
                onClick={() => onDeviceSelect && onDeviceSelect(device)}
                isSelected={selectedIp === device.ip}
              />
              {isIntruder && <AlarmRing />}
            </group>
          );
        })}

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true} 
          autoRotate={!selectedIp} 
          autoRotateSpeed={0.8} 
          maxDistance={50}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
};
