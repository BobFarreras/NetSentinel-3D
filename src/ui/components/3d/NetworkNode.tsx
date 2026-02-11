import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useNetworkNodeState } from "../../hooks/modules/scene3d/useNetworkNodeState";

interface NetworkNodeProps {
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
  name?: string; // Afegim el nom/IP per identificar-lo al log
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  position,
  color = '#00ff00',
  onClick,
  isSelected = false,
  name = 'Unknown'
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
    <mesh
      ref={meshRef}
      position={position}
      onClick={state.handleClick}
      onPointerOver={state.handlePointerOver}
      onPointerOut={state.handlePointerOut}
      scale={state.scale}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={state.nodeColor}
        wireframe={true}
        emissive={state.emissiveColor}
        emissiveIntensity={state.emissiveIntensity}
      />
    </mesh>
  );
};
