export function startCamera(video) {
    navigator.mediaDevices
        .getUserMedia({
            video: true
        })

        .then(stream => {
            video.srcObject = stream;
        })
    
        .catch(error => {
            console.log(
                "No se pudo abrir la cámara",
                error
            );
        });
}