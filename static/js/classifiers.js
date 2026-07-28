// classifiers.js
// Reconocimiento geométrico de letras LSCh usando landmarks MediaPipe

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fingerUp(lm, tip, pip) {
  return dist(lm[tip], lm[0]) >
    dist(lm[pip], lm[0]) * 1.15;
}

export function getFingerStates(lm) {
  return {
    thumb:
      dist(lm[4], lm[17]) >
      dist(lm[3], lm[17]),

    index:
      fingerUp(lm, 8, 6),

    middle:
      fingerUp(lm, 12, 10),

    ring:
      fingerUp(lm, 16, 14),

    pinky:
      fingerUp(lm, 20, 18)
  };
}

export function classifyLetter(lm) {
  if (!lm) return null;
  const s = getFingerStates(lm);
  const fingers = [
    s.index,
    s.middle,
    s.ring,
    s.pinky
  ];
  const open = fingers.filter(x => x).length;
  const thumbIndex =
    dist(lm[4], lm[8]);
  const palm =
    dist(lm[0], lm[9]);
  // A
  if (
    !s.index &&
    !s.middle &&
    !s.ring &&
    !s.pinky &&
    s.thumb
  ) {
    return "A";
  }
  // B
  if (
    s.index &&
    s.middle &&
    s.ring &&
    s.pinky &&
    !s.thumb
  ) {
    return "B";
  }
  // C
  if (
    !s.index &&
    !s.middle &&
    !s.ring &&
    !s.pinky &&
    thumbIndex > palm * 0.8
  ) {
    return "C";
  }
  // D
  if (
    s.index &&
    !s.middle &&
    !s.ring &&
    !s.pinky &&
    s.thumb
  ) {
    return "D";
  }
  // F
  if (
    thumbIndex < palm * 0.45 &&
    s.middle &&
    s.ring &&
    s.pinky
  ) {
    return "F";
  }
  // I
  if (
    s.pinky &&
    !s.index &&
    !s.middle &&
    !s.ring
  ) {
    return "I";
  }
  // L
  if (
    s.index &&
    s.thumb &&
    !s.middle &&
    !s.ring &&
    !s.pinky
  ) {
    return "L";
  }
  // U
  if (
    s.index &&
    s.middle &&
    !s.ring &&
    !s.pinky
  ) {
    let sep = dist(lm[8], lm[12]);
    if (sep < palm * 0.35)
      return "U";
    if (sep >= palm * 0.35)
      return "V";
  }
  // W
  if (
    s.index &&
    s.middle &&
    s.ring &&
    !s.pinky
  ) {
    return "W";
  }
  // Y
  if (
    s.thumb &&
    s.pinky &&
    !s.index &&
    !s.middle &&
    !s.ring
  ) {
    return "Y";
  }
  // S
  if (
    !s.index &&
    !s.middle &&
    !s.ring &&
    !s.pinky &&
    !s.thumb
  ) {
    return "S";
  }
  // O
  if (
    thumbIndex < palm * 0.35 &&
    !s.index &&
    !s.middle
  ) {
    return "O";
  }
  return null;
}
export function classifyCustomGesture(lm) {
  if (!lm) return null;
  const s = getFingerStates(lm);
  if (
    s.thumb &&
    s.index &&
    s.pinky &&
    !s.middle &&
    !s.ring
  ) {
    return "ILoveYou";
  }
  if (
    s.index &&
    s.pinky &&
    !s.middle &&
    !s.ring
  ) {
    return "RockSign";
  }
  return null;
}

export function classifyTwoHandGesture(results) {
  if (
    !results.landmarks ||
    results.landmarks.length < 2
  ) {
    return null;
  }
  const a = results.landmarks[0];
  const b = results.landmarks[1];
  const d = dist(a[0], b[0]);
  const size = dist(a[0], a[9]);
  if (d < size * 2)
    return "TwoHands_Together";
  return null;
}