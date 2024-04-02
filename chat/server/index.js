// Import the necessary modules
const { sendApiChatRequest } = require("../../helpers/retrieval_augmented_generation");
const { fetchOpenAIEmbeddings } = require("../../helpers/fetch_openai_embeddings_api");
const pgvector = require('pgvector/pg');
const { client, connectClient } = require('../../helpers/connection.js');


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
      `SELECT title, abstract, title_vector <-> $1 AS distance 
         FROM text_embedding_3_large 
         ORDER BY title_vector <-> $1 LIMIT 3`,
      searchVector
    );
  
    return rows;
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

                // Filters away columns if it has any array element as substring
                const columnsToFilter = ['_vector', 'distance'];
                const headersKeys = Object.keys(vdbResponse[0]).filter((key) => {
                    return !columnsToFilter.some(filterString => key.includes(filterString));
                  });
                const headers = headersKeys.join(' | ');
                const vdbResults = vdbResponse.map(row => headersKeys.map(key => row[key]).join(' | ')).join('\n\n');


                // RAG instructions
                const ragInstruction = {
                    role: "system", content: `Du er GeoGPT, en hjelpsom chatbot som skal hjelpe brukere finne datasett, og svare på Geomatikk spørsmål. Svar kort og konsist. Svar brukeren sitt spørsmål basert på konteksten:\n\n${headers}\n\n${vdbResults}`,
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
                socket.send(JSON.stringify(ragContext));
                console.log(ragContext);
                console.log(memory);
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
                break;

            case "searchFormSubmit":
                // Extract the input text from the request body
                const searchText = data.payload;

                // Get the vectorized input from OpenAI
                const openaiJsonVectorResponse = await fetchOpenAIEmbeddings(searchText);
                const vdbSearchResponse = await vectorSearch(openaiJsonVectorResponse.data[0].embedding);

                // The vector database results are sent
                const vdbMessage = {
                    action : 'searchVdbResults',
                    payload : vdbSearchResponse,
                }
                socket.send(JSON.stringify(vdbMessage));               
                break;
        
            default:

                console.log(`${data.action} is an invalid server action.`)
                break;
        }

    });
});