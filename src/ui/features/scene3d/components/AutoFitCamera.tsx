// src/ui/features/scene3d/components/AutoFitCamera.tsx
// Camara auto-ajustable: reposiciona la camara al detectar dispositivos para encuadrar la orbita.

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type { DeviceDTO } from "../../../../shared/dtos/NetworkDTOs";

export const AutoFitCamera = ({ devices }: { devices: DeviceDTO[] }) => {
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

