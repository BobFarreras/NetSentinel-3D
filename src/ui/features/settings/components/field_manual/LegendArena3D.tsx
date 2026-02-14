// src/ui/features/settings/components/field_manual/LegendArena3D.tsx
// Descripcion: escena 3D mini para la leyenda. Reutiliza `NetworkNode` (misma geometria/animacion) para demo jugable.

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { NetworkNode } from "../../../scene3d/components/NetworkNode";
import { SCENE_TOKENS } from "../../../scene3d/components/sceneTokens";

export type LegendNodeId = "router" | "host" | "intruder" | "wifi" | "default" | "jammed";

export type LegendNode = {
  id: LegendNodeId;
  title: string;
  color: string;
  subtitle: string;
};

export function LegendArena3D({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: LegendNode[];
  selectedId: LegendNodeId | null;
  onSelect: (id: LegendNodeId) => void;
}) {
  const positions = useMemo(() => {
    // Layout en semiarco, estilo "HUD demo".
    const radius = 5.2;
    const total = nodes.length;
    return nodes.reduce<Record<string, [number, number, number]>>((acc, n, idx) => {
      const angle = ((idx / Math.max(1, total - 1)) * Math.PI) - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      acc[n.id] = [x, 0, z];
      return acc;
    }, {});
  }, [nodes]);

  return (
    <div style={{ width: "100%", height: 260, border: "1px solid rgba(0,255,136,0.12)", background: "#000", borderRadius: 2, overflow: "hidden" }}>
      <Canvas
        camera={{ position: [0, 7.5, 10.5], fov: 50 }}
        resize={{ scroll: false, debounce: 0 }}
        style={{ background: SCENE_TOKENS.bgCanvas }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.0} />
        <Stars radius={80} depth={50} count={2400} factor={3.5} saturation={0} fade speed={0.6} />

        {nodes.map((n) => (
          <group key={n.id} position={positions[n.id]}>
            <NetworkNode
              position={[0, 0, 0]}
              color={n.color}
              name={n.title}
              isSelected={selectedId === n.id}
              isJammed={n.id === "jammed"}
              onClick={() => onSelect(n.id)}
            />
          </group>
        ))}

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.6}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
