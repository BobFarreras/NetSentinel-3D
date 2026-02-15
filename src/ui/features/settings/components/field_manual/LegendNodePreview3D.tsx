// src/ui/features/settings/components/field_manual/LegendNodePreview3D.tsx
// Descripcion: preview 3D mini de un nodo de leyenda. Deshabilita interaccion para no bloquear scroll.

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { NetworkNode } from "../../../scene3d/components/NetworkNode";
import { SCENE_TOKENS } from "../../../scene3d/components/sceneTokens";

const FirstFrameSignal: React.FC<{ onReady?: () => void; forceInvalidate?: boolean }> = ({ onReady, forceInvalidate = false }) => {
  const fired = useRef(false);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!forceInvalidate) return;
    // En modo "demand", pedimos 2 invalidates: uno en mount y otro en el siguiente tick,
    // para evitar el caso donde el primer frame llega antes de que los meshes esten listos.
    invalidate();
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [forceInvalidate, invalidate]);

  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady?.();
  });
  return null;
};

const AnimatedAlarmRing = () => {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 5) * 0.18;
    ringRef.current.scale.set(scale, scale, 1);
    if (!Array.isArray(ringRef.current.material)) {
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.42 + Math.sin(t * 5) * 0.28;
    }
  });
  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1.26, 32]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={0.7} side={THREE.DoubleSide} />
    </mesh>
  );
};

const StaticAlarmRing = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[0.9, 1.26, 32]} />
    <meshBasicMaterial color="#ff0000" transparent opacity={0.65} side={THREE.DoubleSide} />
  </mesh>
);

const StaticJammedRing = () => (
  <mesh rotation={[Math.PI / 2, 0, 0]}>
    <torusGeometry args={[1.35, 0.05, 8, 48]} />
    <meshBasicMaterial color="#ff3355" transparent opacity={0.28} blending={THREE.AdditiveBlending} />
  </mesh>
);

export function LegendNodePreview3D({
  title,
  color,
  isIntruder,
  isJammed,
  isSelected,
  animate = false,
  onReady,
}: {
  title: string;
  color: string;
  isIntruder: boolean;
  isJammed: boolean;
  isSelected: boolean;
  animate?: boolean;
  onReady?: () => void;
}) {
  return (
    <div
      style={{
        width: 132,
        height: 120,
        border: `1px solid ${isSelected ? "rgba(0,229,255,0.45)" : "rgba(0,255,136,0.14)"}`,
        background: "#000",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: isSelected ? "0 0 18px rgba(0,229,255,0.10)" : "none",
        // Critico: el canvas no debe interceptar wheel para permitir scroll del panel Settings.
        pointerEvents: "none",
        flexShrink: 0,
      }}
      aria-label={`LEGEND_NODE_PREVIEW_${title}`}
    >
      <Canvas
        camera={{ position: [0, 2.4, 4.3], fov: 50 }}
        resize={{ scroll: false, debounce: 0 }}
        style={{ background: SCENE_TOKENS.bgCanvas }}
        dpr={0.9}
        // Previews: animamos solo cuando el card esta visible.
        // En estatico, "demand" + invalidate inicial => 1 frame sin coste en scroll.
        frameloop={animate ? "always" : "demand"}
        gl={{ powerPreference: "low-power", antialias: false }}
      >
        <FirstFrameSignal onReady={onReady} forceInvalidate={!animate} />
        <ambientLight intensity={0.7} />
        <pointLight position={[6, 6, 6]} intensity={1.0} />

        <group position={[0, -0.2, 0]}>
          {/* En previews: solo activamos FX pesados cuando esta animando (card visible). */}
          <NetworkNode position={[0, 0, 0]} color={color} name={title} isSelected={isSelected} isJammed={animate && isJammed} />
          {isIntruder && (animate ? <AnimatedAlarmRing /> : <StaticAlarmRing />)}
          {isJammed && !animate && <StaticJammedRing />}
        </group>
      </Canvas>
    </div>
  );
}
