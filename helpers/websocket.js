async function sendWebsocketMessage(action, payload, socket) {
    const message = {
        action: action,
        payload: payload,
    };
    socket.send(JSON.stringify(message));
}


async function sendWebsocketAction(action, socket) {
    const message = {
        action: action,
    };
    socket.send(JSON.stringify(message));
}


async function sendVdbResults(vdbResultObjects, socket) {
    // The vector database results are sent
    const vdbMessage = {
        action : 'searchVdbResults',
        payload : vdbResultObjects,
    };
    socket.send(JSON.stringify(vdbMessage)); 
}

module.exports = { sendWebsocketMessage, sendWebsocketAction, sendVdbResults};