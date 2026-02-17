// src/ui/features/scene3d/components/NetworkNode.tsx
// Nodo 3D: geometria/animacion/handlers de hover+click delegados al hook de estado. Incluye FX cuando Kill Net esta activo.

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useNetworkNodeState } from "../hooks/useNetworkNodeState";
import { JammerSwarmFx } from "./network_node/JammerSwarmFx";

interface NetworkNodeProps {
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
  name?: string; // Afegim el nom/IP per identificar-lo al log
  isJammed?: boolean;
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  position,
  color = '#00ff00',
  onClick,
  isSelected = false,
  name = 'Unknown',
  isJammed = false,
}) => {
  const meshRef = useRef<Mesh>(null);
  const state = useNetworkNodeState({ isSelected, color, name, onClick });

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * state.speed;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={position} scale={state.scale}>
      <mesh
        ref={meshRef}
        onClick={state.handleClick}
        onPointerOver={state.handlePointerOver}
        onPointerOut={state.handlePointerOut}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={state.nodeColor}
          wireframe={true}
          emissive={state.emissiveColor}
          emissiveIntensity={state.emissiveIntensity}
        />
      </mesh>

      {isJammed && <JammerSwarmFx />}
    </group>
  );
};
