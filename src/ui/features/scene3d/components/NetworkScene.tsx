// src/ui/features/scene3d/components/NetworkScene.tsx
// Escena 3D principal: renderiza dispositivos como nodos, labels HTML y controles de camara con estado aislado en hooks.

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from '@react-three/drei';
import { NetworkNode } from './NetworkNode';
import type { DeviceDTO, HostIdentity } from '../../../../shared/dtos/NetworkDTOs';
import { NodeLabel } from './NodeLabel';
import { SCENE_TOKENS } from "./sceneTokens";
import { useNetworkSceneState } from "../hooks/useNetworkSceneState";
import { useI18n } from "../../../i18n";
import { SceneOverlayControls } from "./SceneOverlayControls";
import { AutoFitCamera } from "./AutoFitCamera";
import { AlarmRing } from "./AlarmRing";

interface NetworkSceneProps {
  devices?: DeviceDTO[];
  onDeviceSelect?: (device: DeviceDTO | null) => void;
  selectedIp?: string | null;
  intruders?: string[];
  jammedIps?: string[];
  identity?: HostIdentity | null;
  onUndockScene?: (() => void) | null;
}

export const NetworkScene: React.FC<NetworkSceneProps> = ({ 
  devices = [], 
  onDeviceSelect,
  selectedIp,
  intruders = [],
  jammedIps = [],
  identity = null,
  onUndockScene = null,
}) => {
  const { t } = useI18n();
  const state = useNetworkSceneState({ devices, identity, intruders });
  const centerNode = state.centerNode ?? null;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        background: SCENE_TOKENS.bgContainer,
        position: "relative",
        // Asegura que los overlays (botones) no puedan "escaparse" visualmente del panel en layouts con split.
        overflow: "hidden",
      }}
    >
      <SceneOverlayControls
        onUndockScene={onUndockScene}
        showLabels={state.showLabels}
        onToggleLabels={state.toggleLabels}
        t={t}
      />

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
              name={`${t("scene.node.router")} (${centerNode.ip})`}
              onClick={() => onDeviceSelect && onDeviceSelect(centerNode)}
              isSelected={selectedIp === centerNode.ip}
              isJammed={jammedIps.includes(centerNode.ip)}
            />
            {state.showLabels && (
              <NodeLabel
                title={centerNode.name || centerNode.hostname || t("scene.node.gateway")}
                subtitle={`${centerNode.ip} | ${centerNode.vendor || t("scene.node.routerVendorFallback")}`}
                meta={`MAC: ${centerNode.mac || "?"} | IF: ${identity?.interfaceName || "?"}`}
                type={"ROUTER"}
                confidence={centerNode.deviceTypeConfidence ?? 92}
                isSelected={selectedIp === centerNode.ip}
                variant="router"
                rows={[
                  { label: t("scene.label.ip"), value: centerNode.ip },
                  { label: t("scene.label.mac"), value: centerNode.mac || "?" },
                  { label: t("scene.label.vendor"), value: centerNode.vendor || t("scene.node.routerVendorFallback") },
                  { label: t("scene.label.iface"), value: identity?.interfaceName || "?" },
                  { label: t("scene.label.gw"), value: identity?.gatewayIp || "?" },
                ]}
              />
            )}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 1.6, 64]} />
              <meshBasicMaterial color="#004488" transparent opacity={0.3} />
            </mesh>
          </group>
        ) : (
          <NetworkNode position={[0, 0, 0]} color="#333333" name={t("scene.node.searching")} />
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
          const labelSubtitle = `${device.ip} | ${device.vendor || t("scene.node.unknownVendor")}`;
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
                isJammed={jammedIps.includes(device.ip)}
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
