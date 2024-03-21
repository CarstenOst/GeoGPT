const OpenAI = require("openai");
const { api: {openai_gpt_api_key, openai_organisation_id, openai_gpt_api_model} } = require("../config.js");

const openai = new OpenAI({
  organization: openai_organisation_id,
  apiKey: openai_gpt_api_key,
});


async function sendApiChatRequest(messages, webSocket) {
    // Establishes a stream from the Openai API
    const stream = await openai.chat.completions.create({
        model: openai_gpt_api_model,
        messages: messages,
        stream: true,
    });

    // Receives the response in a stream as it is generated, also stores full Response
    let fullRagResponse = '';
    for await (const chunk of stream) {
        // TODO add stop signal that stops the stream
        const content = chunk.choices[0]?.delta?.content || "";
        const response = {
            action: 'chatStream',
            payload: content,
        };
        webSocket.send(JSON.stringify(response));
        fullRagResponse += content;
    }

    return fullRagResponse;
}

const stopSignal = () => {
    return false; 
};



module.exports = { sendApiChatRequest };