import React, { useEffect, useRef } from 'react';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Validar que los scripts de MediaPipe se cargaron en el window
    if (!window.Hands || !window.Camera) {
      console.error("Los scripts de MediaPipe aún no se han cargado en el navegador.");
      return;
    }

    const { Hands, HAND_CONNECTIONS } = window;
    const { Camera } = window;
    const { drawConnectors, drawLandmarks } = window;

    // 1. Configurar Hands
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // 2. Procesar fotogramas
    hands.onResults((results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: '#9FA292',
            lineWidth: 4,
          });
          drawLandmarks(ctx, landmarks, {
            color: '#A6856A',
            lineWidth: 2,
            radius: 5,
          });
        }
      }
      ctx.restore();
    });

    // 3. Activar la cámara
    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>signSpeakAI — Reconocimiento en Vivo</h1>
      <p>Coloca tu mano frente a la cámara para ver el esqueleto en tiempo real.</p>
      
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{ borderRadius: '12px', border: '2px solid #A9A098', backgroundColor: '#1e1e1e' }}
        />
      </div>
    </div>
  );
}

export default App;