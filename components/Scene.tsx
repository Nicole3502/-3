import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeParticles } from './TreeParticles';
import { TreeDecorations } from './TreeDecorations';
import { BlessingCard } from './BlessingCard';
import { AppState, GestureType, BLESSINGS } from '../types';

interface SceneProps {
  gesture: GestureType;
  handX: number; // 0 to 1
}

const Scene: React.FC<SceneProps> = ({ gesture, handX }) => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE);
  const [showCard, setShowCard] = useState(false);
  const [cardText, setCardText] = useState("");
  const [rotationSpeed, setRotationSpeed] = useState(0);

  // --- Logic Mapping ---
  useEffect(() => {
    // 1. Double Pinch -> Card Mode
    if (gesture === GestureType.DOUBLE_PINCH) {
        if (!showCard) {
            // Pick random text
            const randomText = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
            setCardText(randomText);
            setShowCard(true);
        }
    } else if (gesture === GestureType.OPEN) {
        // 2. Open Hand -> Explode (Unlock card if open hand? No, prompt says open fingers to unlock)
        // Prompt says "Open two fingers to unlock" implies logic. 
        // Let's simplify: If Card is ON, and gesture becomes OPEN or PINCH, we check logic.
        // Prompt: "Zhang kai shuang zhi jie suo" (Open fingers unlock).
        // Let's assume standard "OPEN" gesture dismisses card.
        if (showCard) {
             setShowCard(false);
        }
        setAppState(AppState.EXPLODE);
    } else if (gesture === GestureType.PINCH) {
        // 3. Pinch -> Tree
        if (showCard) {
             setShowCard(false);
        }
        setAppState(AppState.TREE);
    } else {
        // Default / None -> Tree (as per prompt default)
        if (!showCard) {
            setAppState(AppState.TREE);
        }
    }
  }, [gesture]);

  // --- Rotation Logic ---
  useEffect(() => {
      // Prompt: "Hand open and move left/right -> control rotation"
      if (appState === AppState.EXPLODE && gesture === GestureType.OPEN) {
          // Map handX (0..1) to speed (-1 .. 1)
          const speed = (handX - 0.5) * 4; 
          setRotationSpeed(speed);
      } else {
          setRotationSpeed(0.2); // Default slow rotation
      }
  }, [handX, appState, gesture]);


  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={2} color="#FFD700" castShadow />
      <pointLight position={[0, -5, 0]} intensity={1.5} color="#FFD700" distance={10} /> {/* Ground light */}
      <Environment preset="city" />

      {/* Main Content */}
      <group position={[0, -1, 0]}> {/* Shift down slightly to center tree */}
          <TreeParticles appState={appState} rotationSpeed={rotationSpeed} />
          <TreeDecorations appState={appState} />
      </group>

      {/* Blessing Card Overlay (In 3D space) */}
      <BlessingCard visible={showCard} text={cardText} />

      {/* Shadows */}
      <ContactShadows position={[0, -4.5, 0]} opacity={0.5} scale={20} blur={2.5} far={4.5} color="#112244" />

      {/* Post Processing */}
      <EffectComposer disableNormalPass>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.4}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
      </EffectComposer>
    </Canvas>
  );
};

export default Scene;
