// src/ui/features/scene3d/components/NetworkNode.tsx
// Nodo 3D: geometria/animacion/handlers de hover+click delegados al hook de estado. Incluye FX cuando Kill Net esta activo.

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Quaternion, Vector3 } from "three";
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import { useNetworkNodeState } from "../hooks/useNetworkNodeState";

interface NetworkNodeProps {
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
  name?: string; // Afegim el nom/IP per identificar-lo al log
  isJammed?: boolean;
}

const JammerSwarmFx: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const droneARef = useRef<Mesh>(null);
  const droneBRef = useRef<Mesh>(null);
  const droneCRef = useRef<Mesh>(null);
  const beamARef = useRef<Mesh>(null);
  const beamBRef = useRef<Mesh>(null);
  const beamCRef = useRef<Mesh>(null);

  const seedsRef = useRef<
    { phase: number; speed: number; radius: number; yAmp: number; fireBias: number }[]
  >([]);

  if (seedsRef.current.length === 0) {
    // Seeds estables por instancia (el doble-mount de StrictMode en DEV puede reinit, pero es aceptable).
    seedsRef.current = new Array(3).fill(0).map(() => ({
      phase: Math.random() * Math.PI * 2,
      speed: 3.6 + Math.random() * 1.8,
      radius: 1.55 + Math.random() * 0.35,
      yAmp: 0.10 + Math.random() * 0.12,
      fireBias: 0.25 + Math.random() * 0.25,
    }));
  }

  const vUp = useRef(new Vector3(0, 1, 0));
  const vTmp = useRef(new Vector3());
  const vDir = useRef(new Vector3());
  const qTmp = useRef(new Quaternion());

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const g = groupRef.current;
    if (g) {
      g.rotation.y = t * 2.6;
      g.rotation.x = Math.sin(t * 1.3) * 0.12;
    }

    // Ring pulse
    const ring = ringRef.current;
    if (ring) {
      ring.scale.setScalar(1 + Math.sin(t * 5.2) * 0.08);
      if (!Array.isArray(ring.material)) {
        (ring.material as MeshBasicMaterial).opacity = 0.25 + (Math.sin(t * 5.2) * 0.15 + 0.15);
      }
    }

    // Naves/drone swarm: orbitas pseudo-aleatorias + look-at al target (ataque).
    const drones: Array<{ mesh: Mesh | null; beam: Mesh | null; seed: (typeof seedsRef.current)[number] }> = [
      { mesh: droneARef.current, beam: beamARef.current, seed: seedsRef.current[0] },
      { mesh: droneBRef.current, beam: beamBRef.current, seed: seedsRef.current[1] },
      { mesh: droneCRef.current, beam: beamCRef.current, seed: seedsRef.current[2] },
    ];

    for (let i = 0; i < drones.length; i += 1) {
      const d = drones[i];
      if (!d.mesh) continue;

      const s = d.seed;
      const tt = t * s.speed + s.phase;
      const r = s.radius * (1 + 0.12 * Math.sin(t * 2.0 + s.phase));
      const x = Math.cos(tt) * r;
      const z = Math.sin(tt) * r;
      const y =
        0.18 +
        Math.sin(tt * 1.35) * s.yAmp +
        0.06 * Math.sin(t * (6.0 + i * 0.9) + s.phase);

      // Pequenos "swoops" hacia el centro para que parezca ataque y no un circulo perfecto.
      const swoop = 0.12 * Math.max(0, Math.sin(t * (4.6 + i * 0.7) + s.phase * 1.3));
      const pos = d.mesh.position;
      pos.set(x * (1 - swoop), y, z * (1 - swoop));

      // Orientacion: apuntan al centro (target) con un poco de roll.
      d.mesh.lookAt(0, 0, 0);
      d.mesh.rotateZ(Math.sin(t * (5.1 + i)) * 0.35);

      // Rayos: flicker tipo "tesla" entre nave y nodo.
      if (d.beam) {
        const fireGate = Math.sin(t * (9.0 + i * 1.7) + s.phase) > (0.35 - s.fireBias);
        const beamMat = d.beam.material;
        if (!Array.isArray(beamMat)) {
          const m = beamMat as MeshBasicMaterial;
          m.opacity = fireGate ? 0.35 + 0.35 * Math.abs(Math.sin(t * (22 + i * 5.5) + s.phase)) : 0;
        }

        // Beam entre pos actual y (0,0,0)
        const v0 = vTmp.current.copy(pos);
        const v1 = vDir.current.set(0, 0, 0).sub(v0);
        const len = Math.max(0.001, v1.length());
        v1.normalize();
        qTmp.current.setFromUnitVectors(vUp.current, v1);
        d.beam.quaternion.copy(qTmp.current);
        d.beam.position.copy(v0).addScaledVector(v1, len * 0.5);
        d.beam.scale.set(1, len, 1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Pulse ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.05, 8, 48]} />
        <meshBasicMaterial color="#ff3355" transparent opacity={0.3} blending={AdditiveBlending} />
      </mesh>

      {/* Drones: pequenas "naves" orbitando (estilo cyberpunk) */}
      <mesh ref={droneARef}>
        <coneGeometry args={[0.12, 0.34, 6]} />
        <meshStandardMaterial color="#ff3355" emissive="#ff3355" emissiveIntensity={2.4} metalness={0.2} roughness={0.25} />
      </mesh>
      <mesh ref={droneBRef}>
        <coneGeometry args={[0.11, 0.30, 6]} />
        <meshStandardMaterial color="#ff8844" emissive="#ff5522" emissiveIntensity={2.1} metalness={0.2} roughness={0.25} />
      </mesh>
      <mesh ref={droneCRef}>
        <coneGeometry args={[0.105, 0.28, 6]} />
        <meshStandardMaterial color="#ff3355" emissive="#ff3355" emissiveIntensity={2.3} metalness={0.2} roughness={0.25} />
      </mesh>

      {/* Rayos (3): cilindros escalados y orientados dinamicamente hacia el centro */}
      <mesh ref={beamARef}>
        <cylinderGeometry args={[0.012, 0.012, 1, 6, 1, true]} />
        <meshBasicMaterial color="#ff3355" transparent opacity={0} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={beamBRef}>
        <cylinderGeometry args={[0.010, 0.010, 1, 6, 1, true]} />
        <meshBasicMaterial color="#ff8844" transparent opacity={0} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={beamCRef}>
        <cylinderGeometry args={[0.011, 0.011, 1, 6, 1, true]} />
        <meshBasicMaterial color="#ff3355" transparent opacity={0} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
};

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
