import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GOLD_PALETTE, AppState } from '../types';

interface TreeParticlesProps {
  appState: AppState;
  rotationSpeed: number;
}

const PARTICLE_COUNT = 6000;

export const TreeParticles: React.FC<TreeParticlesProps> = ({ appState, rotationSpeed }) => {
  // Use three separate instanced meshes for variety in shape
  const meshRef1 = useRef<THREE.InstancedMesh>(null); // Cubes (Gems)
  const meshRef2 = useRef<THREE.InstancedMesh>(null); // Icosahedrons (Sparkles)
  const meshRef3 = useRef<THREE.InstancedMesh>(null); // Spheres/Tetrahedrons (Matte)

  // Data storage
  const particles = useMemo(() => {
    const data = [];
    const colorHelper = new THREE.Color();
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // --- Tree Shape Math (Cone) ---
      // Height 0 to 1
      const h = Math.random(); 
      // Radius decreases as height increases. Base radius approx 2.5
      const rTree = (1 - h) * 2.5 + (Math.random() * 0.2); 
      const theta = h * 50 + Math.random() * Math.PI * 2; // Spiral up
      
      const treeX = rTree * Math.cos(theta);
      const treeY = (h * 7) - 3.5; // Center vertically. Tree height ~7
      const treeZ = rTree * Math.sin(theta);

      // --- Explode Shape Math (Sphere/Chaos) ---
      // Random point in sphere radius 6
      const rExplode = 2 + Math.random() * 6;
      const thetaExplode = Math.random() * Math.PI * 2;
      const phiExplode = Math.acos(2 * Math.random() - 1);
      
      const explodeX = rExplode * Math.sin(phiExplode) * Math.cos(thetaExplode);
      const explodeY = rExplode * Math.sin(phiExplode) * Math.sin(thetaExplode);
      const explodeZ = rExplode * Math.cos(phiExplode);

      // --- Attributes ---
      const scale = 0.05 + Math.random() * 0.15;
      const colorHex = GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)];
      colorHelper.set(colorHex);

      // Assign to one of the 3 meshes randomly
      const type = Math.floor(Math.random() * 3);

      data.push({
        treePos: new THREE.Vector3(treeX, treeY, treeZ),
        explodePos: new THREE.Vector3(explodeX, explodeY, explodeZ),
        currentPos: new THREE.Vector3(treeX, treeY, treeZ), // Start at tree
        scale,
        color: colorHelper.clone(),
        type,
        rotationOffset: Math.random() * Math.PI
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize colors
  useLayoutEffect(() => {
    [meshRef1, meshRef2, meshRef3].forEach((ref, meshIndex) => {
      if (!ref.current) return;
      let instanceIdx = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (particles[i].type === meshIndex) {
          ref.current.setColorAt(instanceIdx, particles[i].color);
          instanceIdx++;
        }
      }
      ref.current.instanceColor!.needsUpdate = true;
    });
  }, [particles]);

  useFrame((state, delta) => {
    const isExplode = appState === AppState.EXPLODE;
    
    // Group particles by mesh type for updating
    let idx1 = 0, idx2 = 0, idx3 = 0;

    // Global rotation of the container
    const rotationY = state.clock.getElapsedTime() * 0.1 + (rotationSpeed * 5);

    particles.forEach((p, i) => {
      const target = isExplode ? p.explodePos : p.treePos;
      
      // Lerp position
      p.currentPos.lerp(target, delta * 2.5); // Smooth transition speed

      // Add rotation logic
      // We apply the rotation manually to the position to simulate the group rotation
      // while keeping individual particle control
      const x = p.currentPos.x * Math.cos(rotationY) - p.currentPos.z * Math.sin(rotationY);
      const z = p.currentPos.x * Math.sin(rotationY) + p.currentPos.z * Math.cos(rotationY);
      const y = p.currentPos.y;

      dummy.position.set(x, y, z);
      
      // Self-rotation of particles
      dummy.rotation.x = p.rotationOffset + state.clock.getElapsedTime();
      dummy.rotation.y = p.rotationOffset + state.clock.getElapsedTime() * 0.5;
      
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();

      if (p.type === 0 && meshRef1.current) {
        meshRef1.current.setMatrixAt(idx1++, dummy.matrix);
      } else if (p.type === 1 && meshRef2.current) {
        meshRef2.current.setMatrixAt(idx2++, dummy.matrix);
      } else if (p.type === 2 && meshRef3.current) {
        meshRef3.current.setMatrixAt(idx3++, dummy.matrix);
      }
    });

    if (meshRef1.current) meshRef1.current.instanceMatrix.needsUpdate = true;
    if (meshRef2.current) meshRef2.current.instanceMatrix.needsUpdate = true;
    if (meshRef3.current) meshRef3.current.instanceMatrix.needsUpdate = true;
  });

  const materialProps = {
    roughness: 0.3,
    metalness: 0.9,
    envMapIntensity: 1.5,
  };

  return (
    <group>
      {/* Type 1: Cubes (Gemstones) */}
      <instancedMesh ref={meshRef1} args={[undefined, undefined, PARTICLE_COUNT / 3]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial {...materialProps} />
      </instancedMesh>

      {/* Type 2: Icosahedrons (Shiny/Sparkly) */}
      <instancedMesh ref={meshRef2} args={[undefined, undefined, PARTICLE_COUNT / 3]} frustumCulled={false}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial {...materialProps} roughness={0.1} metalness={1} />
      </instancedMesh>

      {/* Type 3: Tetrahedrons/Spheres (Matte Metal) */}
      <instancedMesh ref={meshRef3} args={[undefined, undefined, PARTICLE_COUNT / 3]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial {...materialProps} roughness={0.5} />
      </instancedMesh>
    </group>
  );
};
