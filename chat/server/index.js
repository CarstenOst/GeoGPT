// Import the necessary modules
const { sendApiChatRequest } = require("../../helpers/retrieval_augmented_generation");
const { fetchOpenAIEmbeddings } = require("../../helpers/fetch_openai_embeddings_api");
const pgvector = require('pgvector/pg');
const { client, connectClient } = require('../../helpers/connection.js');

const OpenAI = require("openai");
const { api: {openai_gpt_api_key, openai_organisation_id, openai_gpt_api_model} } = require("../../config.js");

// Connect and register the client type
connectClient();
pgvector.registerType(client);

const WebSocket = require('ws');
const server = new WebSocket.Server( {port : '8080'} );




async function vectorSearch(vectorArray){
    // Perform the search with the vectorized input
    const searchVector = [pgvector.toSql(vectorArray)];
    const { rows } = await client.query(
      `SELECT uuid, title, title_vector <-> $1 AS distance 
         FROM text_embedding_3_large 
         ORDER BY title_vector <-> $1 LIMIT 6`,
      searchVector
    );
  
    return rows;
}




// Establishes a socket connection with the client that can handle messages
server.on('connection', socket => {

    // Keeps track of previous messages sent, using the N last correspondence (user and system message) 
    socket.messages = [];
    socket.on('message', async message => {
        let memory = socket.messages.slice(-6);

        // Extract the input text from the request body
        const questionText = JSON.parse(message).payload;

        // Get the vectorized input from OpenAI
        const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(questionText);
        const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
        const vdbResponse = await vectorSearch(vectorizedInputFromUser);

        const headersKeys = Object.keys(vdbResponse[0]).filter((key) => !key.includes('_vector'));
        const headers = headersKeys.join(' | ');
        const vdbResults = vdbResponse.map(row => headersKeys.map(key => row[key]).join(' | ')).join('\n');

        const ragMessage = `Skriv en respons som finner det mest korresponderende datasettet fra metadata for spørringen. Hjelp meg omformulere spørringen dersom ingen av resultatene besvarer min spørring:\nSpørring:${questionText}\nVektor Database Resultater:\n${headers}\n${vdbResults}`;

        // Loads conversation memory, with new request
        const messages = [
            ...memory,
        { role: "user", content: ragMessage }
        ];

        // First sends the user message
        const userMessage = {
            action: 'userMessage',
            payload: questionText,
        }
        socket.send(JSON.stringify(userMessage));


        // TODO remove this debugging message (shows context given to ChatGPT API)
        const ragContext = {
            action: 'userMessage',
            payload: ragMessage,
        }
        socket.send(JSON.stringify(ragContext));
        // TODO remove this debugging message (shows context given to ChatGPT API)


        // Establishes a socket stream from the Openai API that also returns full response
        const fullRagResponse = await sendApiChatRequest(messages, socket);

        // Add user's question with context and ragResponse to the messages history
        socket.messages.push(
            { role: "user", content: ragMessage },
            { role: "system", content: fullRagResponse },
        );
        

        // After the stream is complete, the vector database response is sent
        const vdbMessage = {
            action : 'chatVdbResults',
            payload : vdbResponse,
        }
        socket.send(JSON.stringify(vdbMessage));

    });
});