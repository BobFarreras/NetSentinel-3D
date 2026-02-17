// src/ui/features/scene3d/components/AlarmRing.tsx
// FX de alarma para intrusos: anillo pulsante con animacion simple en el plano del suelo.

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export const AlarmRing = () => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 5) * 0.2;
    ringRef.current.scale.set(scale, scale, 1);
    if (Array.isArray(ringRef.current.material)) return;
    (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(t * 5) * 0.5;
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 32]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
};
