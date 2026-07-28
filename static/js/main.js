// main.js
// Punto de entrada de la aplicación: maneja la cámara, el bucle de
// reconocimiento con MediaPipe, y toda la interacción de la interfaz
// (modo Traductor y modo Aprendizaje).

import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
import { GESTURES, MODULES, HAND_CONNECTIONS } from "./data.js";
import { classifyLetter, classifyCustomGesture, classifyTwoHandGesture } from "./classifiers.js";

// ---------- referencias DOM ----------
const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const startOverlay = document.getElementById('startOverlay');
const startBtn = document.getElementById('startBtn');
const recDot = document.getElementById('recDot');
const stageStatusText = document.getElementById('stageStatusText');

const tabTranslate = document.getElementById('tabTranslate');
const tabLearn = document.getElementById('tabLearn');
const panelTranslate = document.getElementById('panelTranslate');
const panelLearn = document.getElementById('panelLearn');

const wordText = document.getElementById('wordText');
const confFill = document.getElementById('confFill');
const confLabel = document.getElementById('confLabel');
const voiceSwitch = document.getElementById('voiceSwitch');
const historyList = document.getElementById('historyList');

const progressDots = document.getElementById('progressDots');
const learnVisual = document.getElementById('learnVisual');
const learnWord = document.getElementById('learnWord');
const learnInstruction = document.getElementById('learnInstruction');
const learnFeedback = document.getElementById('learnFeedback');
const manualAdvanceBtn = document.getElementById('manualAdvanceBtn');
const learnScore = document.getElementById('learnScore');
const learnActive = document.getElementById('learnActive');
const learnComplete = document.getElementById('learnComplete');
const learnCompleteTitle = document.getElementById('learnCompleteTitle');
const learnCompleteText = document.getElementById('learnCompleteText');
const restartLearn = document.getElementById('restartLearn');
const moduleTabs = document.getElementById('moduleTabs');
const moduleNote = document.getElementById('moduleNote');

// ---------- estado ----------
let recognizer = null;
let mode = 'translate';
let autoSpeak = false;
let stableGesture = null, stableCount = 0;
const STABLE_THRESHOLD = 5;
let displayedWord = null;
let history = [];

let activeModule = 'gestures';
let learnIndex = 0;
let learnCorrectCount = 0;
let learnMatchCount = 0;
const LEARN_THRESHOLD = 12;
let learnLocked = false;

// ---------- eventos de pestañas de módulo ----------
moduleTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.module-tab');
  if (!btn) return;
  const key = btn.dataset.module;
  if (key === activeModule) return;
  activeModule = key;
  [...moduleTabs.querySelectorAll('.module-tab')].forEach(b => b.classList.toggle('active', b.dataset.module === key));
  learnIndex = 0; learnCorrectCount = 0; learnMatchCount = 0; learnLocked = false;
  learnActive.hidden = false; learnComplete.hidden = true;
  renderLearnTarget();
});

buildProgressDots();
renderLearnTarget();

function buildProgressDots() {
  const seq = MODULES[activeModule].sequence;
  progressDots.innerHTML = '';
  seq.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'dot' + (i < learnIndex ? ' done' : i === learnIndex ? ' current' : '');
    progressDots.appendChild(d);
  });
}

function handIconSVG(p) {
  const fx = { index: 40, middle: 52, ring: 64, pinky: 76 };
  let ix = fx.index, mx = fx.middle;
  if (p.spread) { ix -= 7; mx += 7; }
  const finger = (x, ext, topExt) => {
    const top = ext === 'touch' ? 40 : (ext ? topExt : 50);
    const h = 62 - top;
    const fill = ext ? '#FF6F59' : '#B9C7C3';
    return `<rect x="${x - 5}" y="${top}" width="10" height="${h}" rx="5" fill="${fill}"/>`;
  };
  const thumb = p.thumb === true
    ? `<rect x="8" y="52" width="16" height="30" rx="8" fill="#FF6F59" transform="rotate(-40 16 67)"/>`
    : p.thumb === 'touch'
      ? `<circle cx="${ix}" cy="42" r="7" fill="none" stroke="#FF6F59" stroke-width="3"/>`
      : `<rect x="20" y="58" width="14" height="18" rx="7" fill="#B9C7C3" transform="rotate(-25 27 67)"/>`;
  return `<svg viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="56" width="60" height="46" rx="16" fill="#0B3D3D"/>
    ${thumb}
    ${finger(ix, p.index, 14)}
    ${finger(mx, p.middle, 12)}
    ${finger(fx.ring, p.ring, 16)}
    ${finger(fx.pinky, p.pinky, 22)}
  </svg>`;
}

function renderLearnTarget() {
  const mod = MODULES[activeModule];
  const seq = mod.sequence;
  const key = seq[learnIndex];
  const info = mod.getInfo(key);

  if (info.kind === 'image') {
    learnVisual.innerHTML = `
        <img 
        src="${info.image}" 
        class="sign-image"
        alt="Seña ${key}">
    `;
  }else if (info.kind === 'hand') {
    learnVisual.innerHTML = handIconSVG(info.pattern);
  }else {
    learnVisual.innerHTML = `
        <div class="emoji letter-glyph">
            ${key}
        </div>
    `;
  }

  learnWord.textContent = info.title;
  learnInstruction.textContent = info.instruction;
  learnScore.textContent = mod.verify === 'manual'
    ? `${learnCorrectCount} / ${seq.length} practicadas`
    : `${learnCorrectCount} / ${seq.length} correctas`;
  moduleNote.textContent = mod.note;
  buildProgressDots();

  if (mod.verify === 'manual') {
    learnFeedback.textContent = 'Cuando la domines, márcala como practicada.';
    learnFeedback.className = 'feedback-banner';
    manualAdvanceBtn.hidden = false;
  } else {
    learnFeedback.textContent = 'Esperando tu intento…';
    learnFeedback.className = 'feedback-banner';
    manualAdvanceBtn.hidden = true;
  }
}

// ---------- pestañas principales ----------
tabTranslate.addEventListener('click', () => setMode('translate'));
tabLearn.addEventListener('click', () => setMode('learn'));

function setMode(next) {
  mode = next;
  tabTranslate.classList.toggle('active', mode === 'translate');
  tabLearn.classList.toggle('active', mode === 'learn');
  panelTranslate.hidden = mode !== 'translate';
  panelLearn.hidden = mode !== 'learn';
  stableGesture = null; stableCount = 0;
  learnMatchCount = 0;
}

voiceSwitch.addEventListener('click', () => {
  autoSpeak = !autoSpeak;
  voiceSwitch.classList.toggle('on', autoSpeak);
});

restartLearn.addEventListener('click', () => {
  learnIndex = 0; learnCorrectCount = 0; learnMatchCount = 0; learnLocked = false;
  learnComplete.hidden = true; learnActive.hidden = false;
  renderLearnTarget();
});

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

function pushHistory(word) {
  const time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  history.unshift({ word, time });
  history = history.slice(0, 6);
  historyList.innerHTML = history.map(h => `<li><span>${h.word}</span><span class="t">${h.time}</span></li>`).join('');
}

// ---------- cámara y modelo ----------
startBtn.addEventListener('click', startApp);

async function startApp() {
  startBtn.disabled = true;
  startBtn.textContent = 'Activando…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    video.srcObject = stream;
    await new Promise(res => { video.onloadedmetadata = () => res(); });
    await video.play();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    stageStatusText.textContent = 'Cargando modelo de reconocimiento de manos…';
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
    try {
      recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2
      });
    } catch (gpuErr) {
      console.warn('GPU delegate falló, probando con CPU…', gpuErr);
      recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 2
      });
    }

    startOverlay.hidden = true;
    recDot.style.display = 'inline-block';
    stageStatusText.textContent = 'Cámara activa — reconociendo en vivo';
    requestAnimationFrame(predictLoop);
  } catch (err) {
    console.error(err);
    startBtn.disabled = false;
    startBtn.textContent = 'Reintentar';
    stageStatusText.textContent = 'No se pudo activar la cámara';
    const p = startOverlay.querySelector('p');
    p.innerHTML = 'No se pudo acceder a la cámara o cargar el modelo de IA. Si estás viendo esto dentro de una vista previa integrada, descarga el archivo y ábrelo directamente en tu navegador (o súbelo a un hosting simple) para conceder permiso de cámara.<br><br><span style="color:#FF9C8C;font-family:\'IBM Plex Mono\',monospace;font-size:0.7rem;">' + (err.message || err) + '</span>';
  }
}

function predictLoop() {
  if (!recognizer) return;
  const nowMs = performance.now();
  let results;
  try {
    results = recognizer.recognizeForVideo(video, nowMs);
  } catch (e) {
    requestAnimationFrame(predictLoop);
    return;
  }
  drawOverlay(results);
  handleResults(results);
  requestAnimationFrame(predictLoop);
}

function drawOverlay(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!results || !results.landmarks || results.landmarks.length === 0) return;
  results.landmarks.forEach(lm => {
    ctx.strokeStyle = 'rgba(255,193,69,0.85)';
    ctx.lineWidth = 3;
    HAND_CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
      ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
      ctx.stroke();
    });
    ctx.fillStyle = '#FF6F59';
    lm.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function handleResults(results) {
  let category = null, score = 0;
  const numHands = (results && results.landmarks) ? results.landmarks.length : 0;
  const landmarks = numHands > 0 ? results.landmarks[0] : null;

  if (numHands >= 2) {
    const twoHand = classifyTwoHandGesture(results);
    if (twoHand) { category = twoHand; score = 0.92; }
  }
  if (!category && results && results.gestures && results.gestures.length > 0 && results.gestures[0].length > 0) {
    category = results.gestures[0][0].categoryName;
    score = results.gestures[0][0].score;
  }
  if ((!category || category === 'None') && landmarks) {
    const custom = classifyCustomGesture(landmarks);
    if (custom) { category = custom; score = 0.9; }
  }

  if (category === stableGesture) { stableCount++; } else { stableGesture = category; stableCount = 1; }

  if (mode === 'translate') {
    handleTranslate(category, score);
  } else {
    handleLearn(category, score, landmarks);
  }
}

function handleTranslate(category, score) {
  if (category && category !== 'None' && GESTURES[category] && stableCount >= STABLE_THRESHOLD) {
    const word = GESTURES[category].word;
    confFill.style.width = Math.round(score * 100) + '%';
    confLabel.textContent = `CONFIANZA DEL MODELO — ${Math.round(score * 100)}%`;
    if (displayedWord !== word) {
      displayedWord = word;
      const el = document.getElementById('wordText');
      el.textContent = word;
      el.className = 'big';
      pushHistory(word);
      if (autoSpeak) speak(word);
    }
  } else if ((!category || category === 'None') && stableCount >= STABLE_THRESHOLD) {
    if (displayedWord !== null) {
      displayedWord = null;
      const el = document.getElementById('wordText');
      el.textContent = 'Muestra una seña…';
      el.className = 'waiting';
    }
    confFill.style.width = '0%';
    confLabel.textContent = 'CONFIANZA DEL MODELO — 0%';
  }
}

function advanceLearn() {
  learnLocked = true;
  learnCorrectCount++;
  const mod = MODULES[activeModule];
  const seq = mod.sequence;
  setTimeout(() => {
    learnIndex++;
    learnMatchCount = 0;
    learnLocked = false;
    if (learnIndex >= seq.length) {
      learnActive.hidden = true;
      learnComplete.hidden = false;
      learnCompleteTitle.textContent = '¡Completaste el módulo!';
      learnCompleteText.textContent = `Practicaste las ${seq.length} señas de "${mod.label.replace(/^\S+\s/, '')}".`;
    } else {
      renderLearnTarget();
    }
  }, 900);
}

manualAdvanceBtn.addEventListener('click', () => {
  if (learnLocked) return;
  learnFeedback.textContent = 'Practicada ✔';
  learnFeedback.className = 'feedback-banner correct';
  manualAdvanceBtn.hidden = true;
  advanceLearn();
});

function handleLearn(category, score, landmarks) {
  if (learnLocked) return;
  const mod = MODULES[activeModule];
  if (mod.verify === 'manual') return; // se avanza con el boton manual, no por IA

  const targetKey = mod.sequence[learnIndex];
  let isMatch = false;
  if (mod.verify === 'gesture') {
    isMatch = (category === targetKey && score > 0.55);
  } else {
    isMatch = (classifyLetter(landmarks) === targetKey);
  }

  if (isMatch) {
    learnMatchCount++;
    const pct = Math.min(100, Math.round((learnMatchCount / LEARN_THRESHOLD) * 100));
    learnFeedback.textContent = pct >= 100 ? '¡Correcto!' : `Sigue así… ${pct}%`;
    learnFeedback.className = 'feedback-banner trying';
    if (learnMatchCount >= LEARN_THRESHOLD) {
      learnFeedback.textContent = '¡Correcto! ✔';
      learnFeedback.className = 'feedback-banner correct';
      speak('¡Correcto!');
      advanceLearn();
    }
  } else {
    learnMatchCount = Math.max(0, learnMatchCount - 1);
    if (learnMatchCount === 0) {
      learnFeedback.textContent = 'Esperando tu intento…';
      learnFeedback.className = 'feedback-banner';
    }
  }
}
