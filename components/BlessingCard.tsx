import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface BlessingCardProps {
  visible: boolean;
  text: string;
}

export const BlessingCard: React.FC<BlessingCardProps> = ({ visible, text }) => {
  const groupRef = useRef<THREE.Group>(null);
  const textureRef = useRef<THREE.CanvasTexture>(null);
  
  // Create texture from text
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1400; // Portrait aspect ratio (Postcard)
    return c;
  }, []);

  useEffect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 1024, 1400);
    gradient.addColorStop(0, '#FFD700'); // Gold
    gradient.addColorStop(1, '#E5D2B7'); // Champagne
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1400);

    // Draw Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, 1024 - 80, 1400 - 80);

    // Draw Text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Process text: Split by comma, remove comma
    const parts = text.split(/[,\，]/).filter(p => p.trim() !== '');
    
    // Font setup
    const fontSize = 100;
    ctx.font = `italic 700 ${fontSize}px "Playfair Display", serif`;
    
    // Calculate vertical spacing
    const totalHeight = parts.length * (fontSize * 1.5);
    let startY = (1400 - totalHeight) / 2 + fontSize/2;

    parts.forEach((line, i) => {
        ctx.fillText(line.trim(), 512, startY + (i * fontSize * 1.5));
    });

    // Add small decorative stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for(let i=0; i<20; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1400;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI*2);
        ctx.fill();
    }

    if (textureRef.current) {
        textureRef.current.needsUpdate = true;
    }
  }, [text, canvas]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const targetScale = visible ? 1 : 0;
    const currentScale = groupRef.current.scale.x;
    const lerpSpeed = 0.1;
    
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, lerpSpeed);
    groupRef.current.scale.setScalar(newScale);

    // Floating animation
    if (visible) {
        groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime()) * 0.05;
        groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 4]} scale={0}> 
      {/* 4 units in front of origin, assuming camera is at z=10 */}
      <mesh>
        <planeGeometry args={[4, 5.5]} /> {/* Aspect ratio match canvas */}
        <meshStandardMaterial>
             <canvasTexture ref={textureRef} attach="map" image={canvas} anisotropy={16} />
        </meshStandardMaterial>
      </mesh>
      
      {/* Back of card */}
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4, 5.5]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
};
