import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

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
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const speed = isSelected ? 2 : 0.5;
      meshRef.current.rotation.x += delta * speed;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        // 🛑 ATENCIÓ: Aquest log surt a la CONSOLA DEL NAVEGADOR (F12), no a la terminal
        console.log(`👆 CLICK 3D DETECTAT en: ${name}`);
        e.stopPropagation(); // Evita que el click traspassi
        onClick && onClick();
      }}
      onPointerOver={() => {
        console.log(`👀 Ratolí sobre: ${name}`);
        setHover(true);
        document.body.style.cursor = 'pointer'; // Canvia el cursor a mà
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = 'auto'; // Torna el cursor normal
      }}
      scale={isSelected ? 1.5 : (hovered ? 1.2 : 1)}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial 
        color={isSelected ? '#ffd700' : (hovered ? '#ffffff' : color)} 
        wireframe={true} 
        emissive={isSelected ? '#ffd700' : color}
        emissiveIntensity={isSelected ? 2 : 0.5}
      />
    </mesh>
  );
};