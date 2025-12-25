import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';

interface DecorProps {
  appState: AppState;
}

export const TreeDecorations: React.FC<DecorProps> = ({ appState }) => {
  const ribbonRef = useRef<THREE.InstancedMesh>(null);
  const baseRingRef = useRef<THREE.Group>(null);
  const topperRef = useRef<THREE.Group>(null);
  
  // --- Topper Logic ---
  const topperPos = new THREE.Vector3(0, 3.8, 0); // Tip of tree

  // --- Ribbon Logic ---
  // A spiral of tetrahedrons
  const ribbonCurve = useMemo(() => {
    const points = [];
    // 3 loops
    for (let t = 0; t <= 1; t += 0.005) {
      const h = t * 7 - 3.5; // match tree height
      const r = (1 - t) * 2.8 + 0.3; // slightly wider than tree
      const theta = t * Math.PI * 6; // 3 turns
      points.push(new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta)));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const ribbonPoints = useMemo(() => ribbonCurve.getPoints(200), [ribbonCurve]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const isTree = appState === AppState.TREE;

    // --- Update Ribbon ---
    // In EXPLODE, ribbon expands outward. In TREE, it hugs tree.
    if (ribbonRef.current) {
        ribbonPoints.forEach((pt, i) => {
            const expansion = isTree ? 1 : 2.5 + Math.sin(time + i) * 0.5;
            
            dummy.position.copy(pt).multiplyScalar(1); // Baseline
            // Lerp effect for position expansion could be added here, 
            // but for simplicity, we keep ribbon mostly rigid or static relative to tree
            // Actually let's make it float/breathe
            const floatY = Math.sin(time * 0.5 + pt.y) * 0.1;
            
            // If explode, scatter them
            if (!isTree) {
                dummy.position.x = pt.x * expansion + Math.sin(time + i) * 0.5;
                dummy.position.z = pt.z * expansion + Math.cos(time + i) * 0.5;
                dummy.position.y = pt.y + floatY;
            } else {
                 dummy.position.x = pt.x;
                 dummy.position.z = pt.z;
                 dummy.position.y = pt.y + floatY;
            }
            
            // Continuous rotation of the whole group is handled by parent, 
            // here we handle local spin
            dummy.rotation.x = time + i * 0.1;
            dummy.rotation.y = time * 2;
            
            dummy.scale.setScalar(0.08); // Tiny tetrahedrons
            dummy.updateMatrix();
            ribbonRef.current!.setMatrixAt(i, dummy.matrix);
        });
        ribbonRef.current.instanceMatrix.needsUpdate = true;
    }

    // --- Update Base Rings ---
    if (baseRingRef.current) {
        baseRingRef.current.rotation.y = -time * 0.2; // Counter rotate
        // Expand rings on explode
        const scaleTarget = isTree ? 1 : 1.5;
        baseRingRef.current.scale.lerp(new THREE.Vector3(scaleTarget, scaleTarget, scaleTarget), 0.1);
    }

    // --- Update Topper ---
    if (topperRef.current) {
        topperRef.current.rotation.y = time;
        // Float
        topperRef.current.position.y = topperPos.y + Math.sin(time * 2) * 0.1;
        
        // Explode effect for topper? Maybe just gets brighter or shakes.
    }
  });

  return (
    <group>
      {/* Ribbon */}
      <instancedMesh ref={ribbonRef} args={[undefined, undefined, ribbonPoints.length]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} toneMapped={false} />
      </instancedMesh>

      {/* Topper */}
      <group ref={topperRef} position={[0, 3.8, 0]}>
         {/* Main Sphere */}
        <mesh>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* Halo Particles */}
        <points>
            <sphereGeometry args={[0.6, 16, 16]} />
            <pointsMaterial color="#FFF" size={0.05} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </points>
      </group>

      {/* Base Rings */}
      <group ref={baseRingRef} position={[0, -3.8, 0]}>
         {/* 3 Concentric rings of particles */}
         {[1.5, 2.0, 2.5].map((radius, idx) => (
             <points key={idx} rotation={[Math.PI / 2, 0, 0]}>
                 <torusGeometry args={[radius, 0.05, 16, 100]} />
                 <pointsMaterial color="#E5D2B7" size={0.08} sizeAttenuation transparent opacity={0.8} />
             </points>
         ))}
      </group>
    </group>
  );
};
