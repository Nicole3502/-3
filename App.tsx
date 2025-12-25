import React, { useState } from 'react';
import Scene from './components/Scene';
import GestureController from './components/GestureController';
import { GestureType } from './types';

const App: React.FC = () => {
  const [currentGesture, setCurrentGesture] = useState<GestureType>(GestureType.NONE);
  const [handPos, setHandPos] = useState({ x: 0.5, y: 0.5 });

  return (
    <div className="relative w-full h-screen overflow-hidden text-white selection:bg-yellow-500/30">
        {/* Title */}
        <div className="absolute top-8 left-0 w-full text-center z-10 pointer-events-none">
            <h1 className="text-[#FFD700] text-5xl font-serif tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                MERRY CHRISTMAS
            </h1>
        </div>

        {/* Hand Cursor */}
        <div id="hand-cursor" className="hand-cursor opacity-0 transition-opacity duration-300"></div>

        {/* 3D Scene */}
        <div className="absolute inset-0 z-0">
            <Scene gesture={currentGesture} handX={handPos.x} />
        </div>

        {/* Camera Feed / AI Controller */}
        <GestureController 
            onGestureChange={setCurrentGesture} 
            onHandMove={(x, y) => setHandPos({ x, y })} 
        />
        
        {/* Helper Instructions (Optional UI to guide user) */}
        <div className="absolute bottom-8 left-8 text-yellow-100/50 font-serif text-sm pointer-events-none">
            <p>✊ Pinch to Assemble</p>
            <p>✋ Open to Explode & Rotate</p>
            <p>👌 Double Pinch for Blessing</p>
        </div>
    </div>
  );
};

export default App;
