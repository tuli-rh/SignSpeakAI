// data.js
// Datos estáticos de la aplicación: gestos reconocidos, abecedario LSCh
// y la configuración de cada módulo del modo aprendizaje.

export const GESTURES = {
  Open_Palm: { word: "Hola", emoji: "🖐️", instruction: "Muestra la palma abierta frente a la cámara." },
  Thumb_Up: { word: "Sí", emoji: "👍", instruction: "Levanta el pulgar hacia arriba." },
  Thumb_Down: { word: "No", emoji: "👎", instruction: "Baja el pulgar hacia abajo." },
  Victory: { word: "Paz", emoji: "✌️", instruction: "Forma una V con los dedos índice y medio." },
  Closed_Fist: { word: "Alto", emoji: "✊", instruction: "Cierra la mano en un puño." },
  Pointing_Up: { word: "Señal", emoji: "☝️", instruction: "Gesto de señalar con el dedo índice (no corresponde a la seña LSCh oficial de ayuda)." },
  ILoveYou: { word: "Te quiero", emoji: "🤟", instruction: "Extiende el pulgar, índice y meñique." },
  OkSign: { word: "Perfecto", emoji: "👌", instruction: "Junta la punta del pulgar y el índice; extiende los otros tres dedos." },
  RockSign: { word: "Genial", emoji: "🤘", instruction: "Extiende el índice y el meñique; dobla el pulgar, el medio y el anular." },
  CallMeSign: { word: "Llámame", emoji: "🤙", instruction: "Extiende el pulgar y el meñique; dobla índice, medio y anular." },
  TwoHands_Open: { word: "¡Aplausos!", emoji: "🙌", instruction: "Muestra ambas manos con las palmas abiertas frente a la cámara." },
  TwoHands_Together: { word: "Gracias", emoji: "🙏", instruction: "Junta ambas manos frente a ti, una cerca de la otra." },
  Ayuda: { word: "Ayuda", image: "static/images/signs/ayuda.png", instruction: "Realiza la seña LSCh de AYUDA." }
};
export const LEARN_SEQUENCE = Object.keys(GESTURES);

// Alfabeto dactilológico de la Lengua de Señas Chilena (LSCh) — 27 letras.
// Separado en dos grupos: las que un detector geometrico simple puede
// verificar de forma confiable (forma estatica de una sola mano) y las que
// necesitan movimiento, curvatura o contacto fino entre dedos.
// Abecedario completo Lengua de Señas Chilena (LSCh)

export const ALPHABET_LSCH = {

  A: {
    instruction: "Puño cerrado con el pulgar hacia un lado.",
    image: "static/images/signs/a.png"
  },
  B: "Cuatro dedos extendidos juntos y pulgar pegado.",
  C: "Mano curva formando la letra C.",
  D: "Índice levantado y los demás dedos cerrados.",
  E: "Dedos doblados hacia la palma con pulgar al frente.",
  F: "Pulgar e índice formando un círculo.",
  G: "Índice y pulgar extendidos apuntando.",
  H: "Índice y medio juntos apuntando.",
  I: "Solo el dedo meñique levantado.",
  J: "Letra I realizando movimiento de J.",
  K: "Índice y medio extendidos con pulgar entre ellos.",
  L: "Pulgar e índice formando una L.",
  M: "Pulgar debajo de índice, medio y anular.",
  N: "Pulgar debajo de índice y medio.",
  Ñ: "Como N agregando movimiento.",
  O: "Dedos formando un círculo.",
  P: "Como K pero apuntando hacia abajo.",
  Q: "Pulgar e índice apuntando hacia abajo.",
  R: "Índice y medio cruzados.",
  S: "Puño cerrado con pulgar delante.",
  T: "Pulgar entre índice y medio.",
  U: "Índice y medio juntos levantados.",
  V: "Índice y medio separados formando V.",
  W: "Índice, medio y anular levantados.",
  X: "Índice doblado en forma de gancho.",
  Y: "Pulgar y meñique extendidos.",
  Z: "Índice realizando movimiento en Z."

};
export const ALPHABET_LSCH_SEQUENCE =
  Object.keys(ALPHABET_LSCH);

// Patrones de dedos para dibujar el icono de mano de cada letra IA
// (coinciden exactamente con las reglas de classifyLetter, en classifiers.js).
export const FINGER_PATTERNS = {
  A: { thumb: true, index: false, middle: false, ring: false, pinky: false },
  B: { thumb: false, index: true, middle: true, ring: true, pinky: true },
  D: { thumb: false, index: true, middle: false, ring: false, pinky: false },
  F: { thumb: 'touch', index: 'touch', middle: true, ring: true, pinky: true },
  I: { thumb: false, index: false, middle: false, ring: false, pinky: true },
  L: { thumb: true, index: true, middle: false, ring: false, pinky: false },
  U: { thumb: false, index: true, middle: true, ring: false, pinky: false },
  V: { thumb: false, index: true, middle: true, ring: false, pinky: false, spread: true },
  W: { thumb: false, index: true, middle: true, ring: true, pinky: false },
  Y: { thumb: true, index: false, middle: false, ring: false, pinky: true },
};

export const MODULES = {

  gestures: {
    label: '✋ Gestos',
    verify: 'gesture',
    sequence: LEARN_SEQUENCE,
    note: 'Gestos reconocidos en vivo.',
    getInfo(key) {
      const g = GESTURES[key];
      return {
        title: g.word,
        instruction: g.instruction,
        image: g.image,
        emoji: g.emoji,
        kind: g.image ? "image" : "emoji"
      };
    },
  },
  alphabet_lsch: {
    label: '🤟 Abecedario LSCh',
    verify: 'letter',
    sequence: ALPHABET_LSCH_SEQUENCE,
    note: 'Abecedario completo de Lengua de Señas Chilena.',
    getInfo(key) {
      return {
        title: `Letra ${key}`,
        instruction: ALPHABET_LSCH[key],
        kind: 'letter'
      };
    }
  }
};

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];
