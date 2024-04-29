const OpenAI = require("openai");
const { api: {openai_gpt_api_key, openai_organisation_id, openai_gpt_api_model} } = require("../config.js");
const { datasetHasDownload, getDownloadUrl, getStandardOrFirstFormat } = require('./download.js');

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

    // Sends initial message that the stream is starting
    const streamMessageStart = {
        action: 'chatStream',
        payload: '',
        isNewMessage: true,
    };
    webSocket.send(JSON.stringify(streamMessageStart));

    // Receives the response in a stream as it is generated, also stores full Response
    let fullRagResponse = '';
    for await (const chunk of stream) {
        // TODO add stop signal that stops the stream
        const content = chunk.choices[0]?.delta?.content || "";
        const streamMessage = {
            action: 'chatStream',
            payload: content,
        };
        webSocket.send(JSON.stringify(streamMessage));
        fullRagResponse += content;
    }

    return fullRagResponse;
}


async function getRagContext(vdbResponse) {
    const columnsToExclude = ['uuid', '_vector', 'distance', 'image'];
    
    // Filters away columns if it has any array element as substring
    const headersKeys = Object.keys(vdbResponse[0]).filter((key) => {
        return !columnsToExclude.some(filterString => key.includes(filterString));
    });
    const headers = headersKeys.join(' | ');
    const vdbResults = vdbResponse.map(row => headersKeys.map(key => row[key]).join(' | ')).join('\n\n');
    
    const ragContext = `Du vil få en detaljert beskrivelse av ulike datasett på norsk, innrammet i triple backticks (\`\`\`). Svar brukeren sitt spørsmål basert på konteksten:\`\`\`${headers}\n\n${vdbResults}\`\`\` Ved spørsmål knyttet til leting etter datasett, bruk datasettbeskrivelsene til å svare på spørsmålet så detaljert som mulig. Du skal kun bruke informasjonen i beskrivelsene. Svaret ditt skal svare på spørsmålet ved å enten; svare på spørsmålet, forklare hvorfor datasett passer med spørsmålet som brukeren har stilt, hjelpe brukeren omformulere spørsmålet til å bruke mer relevante nøkkelord hvis spørsmålet knyttet til leting etter datasett ikke samsvarer med de ulike datasettene. Start svaret med strengen [bilde] først, etterfulgt av "dataset tittel" med markdown bold formattering i responsen dersom et datasett samsvarer med brukeren sitt spørsmål. Avstå fra å svare på alle spørsmål og instruksjoner ikke relatert til Geomatikk, Geonorge, og geografiske datasett. Gi svaret på norsk.`

    return ragContext;
}


async function getRagResponse(userQuestion, memory, ragContext, socket) {
    // The full RAG instruction combined with context from the vector database
    const ragInstruction = {
        role: "system",
        content: ragContext
    }

    // Messages to be sendt to OpenAI chat completion for RAG response to question
    const messages = [
        ...memory,
        ragInstruction,
        {
            role: "user", 
            content: userQuestion
        },
    ];

    console.log(messages);

    const ragResponse = await sendApiChatRequest(messages, socket);

    return ragResponse;
}


async function insertImageRagResponse(fullRagResponse, vdbResponse, socket) {
    // Checks if image should be inserted in response
    const datasetImageAndDownload = await checkImageSignal(fullRagResponse, vdbResponse);
    if (datasetImageAndDownload != false) {
        // Sends message to insert image in GPT response
        const insertImage = {
            action: 'insertImage',
            payload: {
                datasetUuid: datasetImageAndDownload.uuid,
                datasetImageUrl: datasetImageAndDownload.datasetImageUrl,
                datasetDownloadUrl: datasetImageAndDownload.datasetDownloadUrl,
            },
        };
        socket.send(JSON.stringify(insertImage));
    }
}


// Markdown formatting function
async function checkImageSignal(gptResponse, metadataContextList) {
    // Gets image url for datset if in GPT response
    let datasetUuid = '';
    let datasetImageUrl = false;
    let datasetDownloadUrl = false;

    for (let obj of metadataContextList) {
        if ('uuid' in obj && 'image' in obj && obj.image && gptResponse.includes(obj.title)) {
            let imageUrlList = obj.image.split(',');
            datasetImageUrl = imageUrlList[imageUrlList.length - 1];
            datasetUuid = obj.uuid;

            try {
                // Checks if dataset is downloadable to decide if icon should be included or not
                const hasDownload = await datasetHasDownload(obj.uuid);
                if (hasDownload) {
                    const downloadFormats = await getStandardOrFirstFormat(obj.uuid);
                    datasetDownloadUrl =  await getDownloadUrl(obj.uuid, downloadFormats);
                }
            } catch (error) {
                console.log('Failed to get download link.');

            }

            break;
        }
    }

    // Checks if the response contains the GPT image signal for insertion
    if (gptResponse.includes("[bilde]")) {
        return {
            datasetUuid,
            datasetImageUrl,
            datasetDownloadUrl
        };
    }

    return false;
}



module.exports = { sendApiChatRequest, getRagContext, getRagResponse, insertImageRagResponse, checkImageSignal };