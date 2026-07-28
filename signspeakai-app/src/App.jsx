import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [traduccion, setTraduccion] = useState("Esperando seña...");
  const [precision, setPrecision] = useState(0);

  // ⚠️ REEMPLAZA ESTA URL CON TU NUEVO ENLACE DE TEACHABLE MACHINE
  const URL_MODELO =
    "https://teachablemachine.withgoogle.com/models/nYbXwzuLj/";
  useEffect(() => {
    let model;

    async function cargarModeloYCamara() {
      try {
        // 1. Cargar el modelo de Teachable Machine
        const modelURL = URL_MODELO + "model.json";
        const metadataURL = URL_MODELO + "metadata.json";
        model = await tmImage.load(modelURL, metadataURL);

        // Clases globales desde index.html
        const { Hands, HAND_CONNECTIONS } = window;
        const { Camera } = window;
        const { drawConnectors, drawLandmarks } = window;

        if (!Hands || !Camera) {
          console.error("Cargando librerías de MediaPipe...");
          return;
        }

        // 2. Configurar MediaPipe Hands
        const hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(async (results) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          // Dibujar el esqueleto de las manos
          if (results.multiHandLandmarks) {
            for (const landmarks of results.multiHandLandmarks) {
              if (drawConnectors && HAND_CONNECTIONS) {
                drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                  color: "#00FF00",
                  lineWidth: 4,
                });
              }
              if (drawLandmarks) {
                drawLandmarks(ctx, landmarks, {
                  color: "#FF0000",
                  lineWidth: 2,
                  radius: 4,
                });
              }
            }
          }
          ctx.restore();

          // 3. Evaluar la imagen con Teachable Machine
          if (videoRef.current && model) {
            const prediction = await model.predict(videoRef.current);

            let mejorPrediccion = { className: "Neutro", probability: 0 };
            for (let i = 0; i < prediction.length; i++) {
              if (prediction[i].probability > mejorPrediccion.probability) {
                mejorPrediccion = prediction[i];
              }
            }

            // Exigimos 80% de precisión para traducir
            if (mejorPrediccion.probability > 0.8) {
              setTraduccion(mejorPrediccion.className);
              setPrecision(Math.round(mejorPrediccion.probability * 100));
            } else {
              setTraduccion("Esperando seña...");
              setPrecision(0);
            }
          }
        });

        // 4. Iniciar la Cámara
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
      } catch (error) {
        console.error("Error al inicializar:", error);
      }
    }

    cargarModeloYCamara();
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        backgroundColor: "#1e1e2e",
        color: "white",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1>signSpeakAI — Traductor en Vivo</h1>

      {/* Cajas de Resultado */}
      <div
        style={{
          margin: "20px auto",
          padding: "15px",
          backgroundColor: "#2b2b3d",
          borderRadius: "10px",
          maxWidth: "500px",
        }}
      >
        <h2>
          Traducción: <span style={{ color: "#00FF00" }}>{traduccion}</span>
        </h2>
        <p>Confianza de la IA: {precision}%</p>
      </div>

      {/* Cámara y Canvas */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <video
          ref={videoRef}
          style={{ display: "none" }}
          width="640"
          height="480"
        />
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ borderRadius: "15px", border: "3px solid #00FF00" }}
        />
      </div>
    </div>
  );
}

export default App;
