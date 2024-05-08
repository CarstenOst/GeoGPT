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


module.exports = { sendWebsocketMessage, sendWebsocketAction};