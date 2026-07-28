import { GESTURES } from "./gestures.js";

const image =
    document.getElementById("gestureImage");
const name =
    document.getElementById("gestureName");
const description =
    document.getElementById("gestureDescription");

export function showGesture(id) {

    const gesture = GESTURES[id];

    if (!gesture) {
        return;
    }

    image.src =
        "/static/" + gesture.image;

    name.textContent =
        gesture.name;

    description.textContent =
        gesture.description;
}

// ejemplo de prueba
showGesture("Open_Palm");