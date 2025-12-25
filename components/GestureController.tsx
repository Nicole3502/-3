import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';
import { GestureType } from '../types';

interface GestureControllerProps {
  onGestureChange: (gesture: GestureType) => void;
  onHandMove: (x: number, y: number) => void;
}

const GestureController: React.FC<GestureControllerProps> = ({ onGestureChange, onHandMove }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const lastGestureRef = useRef<GestureType>(GestureType.NONE);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();

  // Initialize MediaPipe
  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });
      setLoaded(true);
    };
    init();

    return () => {
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
  }, []);

  // Start Camera
  useEffect(() => {
    if (!loaded || !videoRef.current) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    startCamera();

    return () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if(videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, [loaded]);

  const predictWebcam = () => {
    if (!videoRef.current || !canvasRef.current || !handLandmarkerRef.current) return;
    
    // Check if video is actually playing
    if(videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Drawing utils setup
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const drawingUtils = new DrawingUtils(ctx);

    const startTimeMs = performance.now();
    const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Mirror effect for preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    let currentGesture = GestureType.NONE;

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      
      // Draw connectors
      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#FFD700",
        lineWidth: 2
      });
      drawingUtils.drawLandmarks(landmarks, { color: "#FFFFFF", lineWidth: 1, radius: 2 });

      // --- Gesture Logic ---
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];
      const wrist = landmarks[0];

      // Calculate distances
      const dist = (p1: any, p2: any) => Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2)
      );

      const thumbIndexDist = dist(thumbTip, indexTip);
      const tipsToWristDist = (dist(indexTip, wrist) + dist(middleTip, wrist) + dist(ringTip, wrist) + dist(pinkyTip, wrist)) / 4;

      // 1. Double Pinch: Thumb and Index very close
      if (thumbIndexDist < 0.06) {
        currentGesture = GestureType.DOUBLE_PINCH;
      } 
      // 2. Fist/Pinch (TREE): Fingers curled in (low average distance to wrist)
      else if (tipsToWristDist < 0.25) { 
        currentGesture = GestureType.PINCH;
      } 
      // 3. Open Hand (EXPLODE): Fingers extended
      else if (tipsToWristDist > 0.35) {
        currentGesture = GestureType.OPEN;
      }

      // Hand Position Normalization (0-1) for rotation control
      // Invert X because of mirror
      const normalizedX = 1 - landmarks[9].x; 
      const normalizedY = landmarks[9].y;
      onHandMove(normalizedX, normalizedY);
      
      // Update cursor in DOM
      const cursor = document.getElementById('hand-cursor');
      if (cursor) {
        cursor.style.left = `${normalizedX * 100}vw`;
        cursor.style.top = `${normalizedY * 100}vh`;
        cursor.style.opacity = '1';
      }

    } else {
        // Hide cursor if no hand
        const cursor = document.getElementById('hand-cursor');
        if (cursor) cursor.style.opacity = '0';
    }

    ctx.restore();

    // Debounce/Filter gesture changes
    if (currentGesture !== lastGestureRef.current) {
        // Simple state machine or debounce could go here if needed
        lastGestureRef.current = currentGesture;
        onGestureChange(currentGesture);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(37,66,101,0.5)] z-50 bg-black/30 backdrop-blur-sm">
      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-yellow-200">Loading AI...</div>}
    </div>
  );
};

export default GestureController;
