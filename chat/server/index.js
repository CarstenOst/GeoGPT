// Import the necessary modules
const { getRagContext, getRagResponse, insertImageRagResponse } = require("../../helpers/retrieval_augmented_generation.js");
const { getStandardOrFirstFormat, getDownloadUrl, getDatasetDownloadAndWmsStatus } = require('../../helpers/download.js');
const { getVdbResponse, getVdbSearchResponse } = require('../../helpers/vector_database.js');
const { sendUserMessage, endRagStream, markdownFormatRagMessage, sendVdbResults } = require('../../helpers/websocket.js');



const WebSocket = require('ws');
const server = new WebSocket.Server( {port : '8080'} );

// Establishes a socket connection with the client that can handle messages
server.on('connection', socket => {
    
    // Used to keep track of previous messages sent between user and ChatGPT, using the N last correspondence (user and system message) 
    socket.messages = [];
    socket.on('message', async message => {

        // Controller that decides what action to take based on the sendt action
        const data = JSON.parse(message); // The received client data from the websocket connection containing action and payload
        switch (data.action) {
            case "chatFormSubmit":
                // Extract the input text from the request body
                const userQuestion = data.payload;
                let memory = socket.messages.slice(-6);

                // Gets the VDB relevant results which is used in the ragContext
                const vdbResponse = await getVdbResponse(userQuestion);
                const ragContext = await getRagContext(vdbResponse);

                // Displays user question in chat
                await sendUserMessage(userQuestion, socket);

                // Sends RAG request with context and instruction
                const fullRagResponse = await getRagResponse(userQuestion, memory, ragContext, socket);
                await endRagStream(socket)

                // Add user's question with context and ragResponse to the messages history
                socket.messages.push(
                    { role: "user", content: userQuestion },
                    { role: "system", content: fullRagResponse },
                );

                await insertImageRagResponse(fullRagResponse, vdbResponse)
                await markdownFormatRagMessage(socket);
                break;

            case "searchFormSubmit":
                // Searches the vector database using the query from the message payload
                const vdbSearchResponse = await getVdbSearchResponse(data.payload)
                
                const datasetsWithDownloadAndWmsStatus = await getDatasetDownloadAndWmsStatus(vdbSearchResponse);

                //console.log(`Vector database results:\n${Object.keys(vdbSearchResponse[0])}\n\n${Object.values(vdbSearchResponse[0])}`);
                console.log(`Vector database results:\n${Object.keys(datasetsWithDownloadAndWmsStatus[0])}\n\n${Object.values(datasetsWithDownloadAndWmsStatus[0])}`);
                // TODO update teh vdbSearchResponse object list so that the objects includes a boolean value indicating if the dataset has download via API

                await sendVdbResults(datasetsWithDownloadAndWmsStatus, socket);
              
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