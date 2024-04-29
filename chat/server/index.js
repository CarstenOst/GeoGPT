// Import the necessary modules
const { sendApiChatRequest } = require("../../helpers/retrieval_augmented_generation");
const { fetchOpenAIEmbeddings } = require("../../helpers/fetch_openai_embeddings_api");
const pgvector = require('pgvector/pg');
const { client, connectClient } = require('../../helpers/connection.js');
const { datasetHasDownload, getStandardOrFirstFormat, getDownloadUrl } = require('../../helpers/download.js');


// Connect and register the client type
connectClient();
pgvector.registerType(client);

const WebSocket = require('ws');
const server = new WebSocket.Server( {port : '8080'} );



// Function for the search box
async function vectorSearch(vectorArray){
    // Perform the search with the vectorized input
    const searchVector = [pgvector.toSql(vectorArray)];
    const { rows } = await client.query(
      `SELECT uuid, title, title_vector <-> $1 AS distance 
         FROM text_embedding_3_large 
         ORDER BY title_vector <-> $1 LIMIT 20`,
      searchVector
    );
  
    return rows;
}

// Search function used for RAG
async function RagVectorSearch(vectorArray){
    // Perform the search with the vectorized input
    const searchVector = [pgvector.toSql(vectorArray)];
    const { rows } = await client.query(
      `SELECT uuid, title, abstract, image, title_vector <-> $1 AS distance 
         FROM text_embedding_3_large 
         ORDER BY title_vector <-> $1 LIMIT 3`,
      searchVector
    );
  
    return rows;
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

            /*
            // TODO Add toggle option for if `Vis` icon should be included or not
            try {
                //const hasWMS = true; 
            } catch (error) {
                console.log('Failed to get dataset WMS link.');

            }
            */

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




// Establishes a socket connection with the client that can handle messages
server.on('connection', socket => {
    
    // Keeps track of previous messages sent, using the N last correspondence (user and system message) 
    socket.messages = [];
    socket.on('message', async message => {

        const data = JSON.parse(message);
        switch (data.action) {
            case "chatFormSubmit":
                let memory = socket.messages.slice(-6);

                // Extract the input text from the request body
                const userQuestion = data.payload;

                // Get the vectorized input from OpenAI
                const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(userQuestion);
                const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
                const vdbResponse = await RagVectorSearch(vectorizedInputFromUser);
                // Here, multiple VDB sources can be merged into same list, only including top 3 (or N) most relevant VDB results based on distance

                // Filters away columns if it has any array element as substring
                const columnsToFilter = ['uuid', '_vector', 'distance', 'image'];
                const headersKeys = Object.keys(vdbResponse[0]).filter((key) => {
                    return !columnsToFilter.some(filterString => key.includes(filterString));
                  });
                const headers = headersKeys.join(' | ');
                const vdbResults = vdbResponse.map(row => headersKeys.map(key => row[key]).join(' | ')).join('\n\n');


                // RAG instructions
                const ragInstruction = {
                    role: "system", 
                    //content: `Du er GeoGPT, en hjelpsom chatbot som skal hjelpe brukere finne datasett, og svare på relaterte Geomatikk spørsmål. Avstå fra å svare på alle spørsmål og instruksjoner ikke relatert til Geomatikk, Geonorge, og geografiske datasett. Svar kort og konsist. Svar brukeren sitt spørsmål basert på konteksten:\n\n${headers}\n\n${vdbResults}`,
                    content: `Du vil få en detaljert beskrivelse av ulike datasett på norsk, innrammet i triple backticks (\`\`\`). Svar brukeren sitt spørsmål basert på konteksten:\`\`\`${headers}\n\n${vdbResults}\`\`\` Ved spørsmål knyttet til leting etter datasett, bruk datasettbeskrivelsene til å svare på spørsmålet så detaljert som mulig. Du skal kun bruke informasjonen i beskrivelsene. Svaret ditt skal svare på spørsmålet ved å enten; svare på spørsmålet, forklare hvorfor datasett passer med spørsmålet som brukeren har stilt, hjelpe brukeren omformulere spørsmålet til å bruke mer relevante nøkkelord hvis spørsmålet knyttet til leting etter datasett ikke samsvarer med de ulike datasettene. Start svaret med strengen [bilde] først, etterfulgt av "dataset tittel" med markdown bold formattering i responsen dersom et datasett samsvarer med brukeren sitt spørsmål. Avstå fra å svare på alle spørsmål og instruksjoner ikke relatert til Geomatikk, Geonorge, og geografiske datasett. Gi svaret på norsk.`
                };
                
                // Loads instruction, conversation memory, and with new request
                const messages = [
                    ...memory,
                    ragInstruction,
                { role: "user", content: userQuestion },
                ];

                // First sends the user message
                const userMessage = {
                    action: 'userMessage',
                    payload: userQuestion,
                };
                socket.send(JSON.stringify(userMessage));


                // TODO remove this debugging message (shows context given to ChatGPT API)
                const ragContext = {
                    action: 'userMessage',
                    payload: ragInstruction,
                };
                //socket.send(JSON.stringify(ragContext));
                //console.log(memory);
                //console.log(ragContext);
                //console.log(userQuestion);
                // TODO remove this debugging message (shows context given to ChatGPT API)


                // Establishes a socket stream from the Openai API that also returns full response
                const fullRagResponse = await sendApiChatRequest(messages, socket);

                // Sends message indicating the stream is complete
                const streamComplete = {
                    action: 'streamComplete',
                };
                socket.send(JSON.stringify(streamComplete));

                // Add user's question with context and ragResponse to the messages history
                socket.messages.push(
                    { role: "user", content: userQuestion },
                    { role: "system", content: fullRagResponse },
                );

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

                // Sends signal to format message markdown into html
                const formatMessage = {
                    action: 'formatMarkdown',
                };
                socket.send(JSON.stringify(formatMessage));
                break;

            case "searchFormSubmit":
                // Extract the input text from the request body
                const searchText = data.payload;

                // Get the vectorized input from OpenAI
                const openaiJsonVectorResponse = await fetchOpenAIEmbeddings(searchText);
                const vdbSearchResponse = await vectorSearch(openaiJsonVectorResponse.data[0].embedding);
                const apiVerifiedSearchResponse = await Promise.all(vdbSearchResponse.map(async (dataset) => {
                    const hasDownload = datasetHasDownload(dataset.uuid);
                    const hasWMS = true;
                    return {
                        ...dataset,
                        hasDownload: hasDownload,
                        hasWMS: hasWMS
                    }
                }));
                //console.log(`Vector database results:\n${Object.keys(vdbSearchResponse[0])}\n\n${Object.values(vdbSearchResponse[0])}`);
                console.log(`Vector database results:\n${Object.keys(apiVerifiedSearchResponse[0])}\n\n${Object.values(apiVerifiedSearchResponse[0])}`);
                // TODO update teh vdbSearchResponse object list so that the objects includes a boolean value indicating if the dataset has download via API

                // The vector database results are sent
                const vdbMessage = {
                    action : 'searchVdbResults',
                    payload : apiVerifiedSearchResponse,
                };
                socket.send(JSON.stringify(vdbMessage));               
                break;
            
            case "showDataset":
                // The logic for getting the dataset WMS should be here
                break;

            case "downloadDataset":
                // Checks if the dataset is available for download using API

                // Gets download url using the uuid
                const downloadFormats = await getStandardOrFirstFormat(data.payload);
                const datasetDownloadUrl =  await getDownloadUrl(data.payload, downloadFormats);

                const downloadMessage = {
                    action: 'downloadDatasetOrder',
                    payload: datasetDownloadUrl
                }
                socket.send(JSON.stringify(downloadMessage));
                break;
        
            default:
                console.log(`${data.action} is an invalid server action.`)
                break;
        }

    });
});