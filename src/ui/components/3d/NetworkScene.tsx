import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { NetworkNode } from './NetworkNode';
import { DeviceDTO, HostIdentity } from '../../../shared/dtos/NetworkDTOs';
import * as THREE from 'three';
import { NodeLabel } from './NodeLabel';
import { SCENE_TOKENS } from "./sceneTokens";
import { useNetworkSceneState } from "../../hooks/modules/scene3d/useNetworkSceneState";

interface NetworkSceneProps {
  devices?: DeviceDTO[];
  onDeviceSelect?: (device: DeviceDTO | null) => void;
  selectedIp?: string | null;
  intruders?: string[];
  identity?: HostIdentity | null;
  onUndockScene?: (() => void) | null;
}

// --- COMPONENTE: CAMARA AUTO-AJUSTABLE ---
const AutoFitCamera = ({ devices }: { devices: DeviceDTO[] }) => {
  // Fix: quitamos propiedades no usadas para evitar warnings.
  const { camera } = useThree();
  
  useEffect(() => {
    if (devices.length === 0) return;

    // Logica simple: si hay dispositivos, nos alejamos para ver el anillo.
    const TARGET_RADIUS = 12; 
    const VIEW_ANGLE = 45 * (Math.PI / 180);
    const requiredDistance = TARGET_RADIUS / Math.tan(VIEW_ANGLE / 2);
    
    // Posicion objetivo.
    const newY = requiredDistance * 0.8; 
    const newZ = requiredDistance * 0.8;

    camera.position.set(0, newY, newZ);
    camera.lookAt(0, 0, 0);

  }, [devices.length, camera]);

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
  onUndockScene = null,
}) => {
  const state = useNetworkSceneState({ devices, identity, intruders });
  const centerNode = state.centerNode ?? null;

  return (
    <div style={{ width: '100%', height: '100%', background: SCENE_TOKENS.bgContainer, position: 'relative' }}>
      {/* Toggle UI: oculta/muestra labels sin afectar a los nodos 3D */}
      <button
        onClick={state.toggleLabels}
        title={state.showLabels ? 'Ocultar tarjetas' : 'Mostrar tarjetas'}
        aria-label="TOGGLE_NODE_LABELS"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 80,
          width: 34,
          height: 34,
          borderRadius: 2,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0.35))',
          border: `1px solid ${state.showLabels ? 'rgba(0,229,255,0.55)' : 'rgba(0,255,136,0.35)'}`,
          boxShadow: state.showLabels ? '0 0 16px rgba(0,229,255,0.25)' : '0 0 16px rgba(0,255,136,0.18)',
          color: state.showLabels ? SCENE_TOKENS.accentCyan : SCENE_TOKENS.accentGreen,
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          fontFamily: SCENE_TOKENS.fontMono,
          userSelect: 'none',
        }}
      >
        {state.showLabels ? (
          // "ojo tachado" minimal
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <path d="M4 4l16 16" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
      {onUndockScene && (
        <button
          onClick={onUndockScene}
          title="Desacoplar escena 3D"
          aria-label="UNLOCK_SCENE3D"
          style={{
            position: 'absolute',
            top: 12,
            right: 52,
            zIndex: 80,
            width: 34,
            height: 34,
            borderRadius: 2,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0.35))',
            border: '1px solid rgba(0,255,136,0.35)',
            boxShadow: '0 0 16px rgba(0,255,136,0.18)',
            color: SCENE_TOKENS.accentGreen,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontFamily: SCENE_TOKENS.fontMono,
            userSelect: 'none',
            fontSize: 16,
            lineHeight: '16px',
            padding: 0,
          }}
        >
          ↗
        </button>
      )}
        <Canvas 
        camera={{ position: [0, 20, 25], fov: 50 }} 
        resize={{ scroll: false, debounce: 0 }} 
        style={{ background: SCENE_TOKENS.bgCanvas }}
        onPointerMissed={() => onDeviceSelect && onDeviceSelect(null)}
      >
        <AutoFitCamera devices={devices} />

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {/* Centro (gateway/router) */}
        {centerNode ? (
          <group position={[0, 0, 0]}>
            <NetworkNode 
              position={[0, 0, 0]} 
              color="#0088ff" 
              name={`ROUTER (${centerNode.ip})`}
              onClick={() => onDeviceSelect && onDeviceSelect(centerNode)}
              isSelected={selectedIp === centerNode.ip}
            />
            {state.showLabels && (
              <NodeLabel
                title={centerNode.name || centerNode.hostname || "GATEWAY"}
                subtitle={`${centerNode.ip} | ${centerNode.vendor || "Router"}`}
                meta={`MAC: ${centerNode.mac || "?"} | IF: ${identity?.interfaceName || "?"}`}
                type={"ROUTER"}
                confidence={centerNode.deviceTypeConfidence ?? 92}
                isSelected={selectedIp === centerNode.ip}
                variant="router"
                rows={[
                  { label: "IP", value: centerNode.ip },
                  { label: "MAC", value: centerNode.mac || "?" },
                  { label: "VENDOR", value: centerNode.vendor || "Router" },
                  { label: "IFACE", value: identity?.interfaceName || "?" },
                  { label: "GW", value: identity?.gatewayIp || "?" },
                ]}
              />
            )}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.6, 64]} />
              <meshBasicMaterial color="#004488" transparent opacity={0.3} />
            </mesh>
          </group>
        ) : (
          <NetworkNode position={[0, 0, 0]} color="#333333" name="SEARCHING..." />
        )}

        {/* Orbita (resto de dispositivos) */}
        {state.orbitingNodes.map((device, index) => {
          const totalNodes = state.orbitingNodes.length;
          const radius = 10;
          const angle = (index / totalNodes) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          const isIntruder = intruders.includes(device.ip);
          const nodeColor = state.getNodeColor(device);

          const labelTitle = device.name || device.hostname || device.ip;
          const labelSubtitle = `${device.ip} | ${device.vendor || 'Desconocido'}`;
          const labelType = device.deviceType || 'UNKNOWN';
          const labelConfidence = device.deviceTypeConfidence ?? 40;

          return (
            <group position={[x, 0, z]} key={device.ip}>
              <NetworkNode 
                position={[0, 0, 0]} 
                color={nodeColor} 
                name={device.ip}
                onClick={() => onDeviceSelect && onDeviceSelect(device)}
                isSelected={selectedIp === device.ip}
              />
              {state.showLabels && (
                <NodeLabel
                  title={labelTitle}
                  subtitle={labelSubtitle}
                  meta={`MAC: ${device.mac}`}
                  type={labelType}
                  confidence={labelConfidence}
                  isSelected={selectedIp === device.ip}
                />
              )}
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
