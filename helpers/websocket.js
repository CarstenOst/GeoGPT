async function sendWebsocketMessage(action, payload, socket) {
    const message = {
        action: action,
        payload: payload,
    };
    socket.send(JSON.stringify(message));
}

async function sendUserMessage(userMessage, socket) {
    // First sends the user message
    const message = {
        action: 'userMessage',
        payload: userMessage,
    };
    socket.send(JSON.stringify(message));
}

async function endRagStream(socket) {
    // Sends message indicating the stream is complete
    const streamComplete = {
        action: 'streamComplete',
    };
    socket.send(JSON.stringify(streamComplete));
}


async function markdownFormatRagMessage(socket) {
    // Sends signal to format message markdown into html
    const formatMessage = {
        action: 'formatMarkdown',
    };
    socket.send(JSON.stringify(formatMessage));
}


async function sendVdbResults(vdbResultObjects, socket) {
    // The vector database results are sent
    const vdbMessage = {
        action : 'searchVdbResults',
        payload : vdbResultObjects,
    };
    socket.send(JSON.stringify(vdbMessage)); 
}

module.exports = { sendWebsocketMessage, sendUserMessage, endRagStream, markdownFormatRagMessage, sendVdbResults};