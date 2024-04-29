const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());


// Import the necessary modules
const fetchEmbedding = require("../../helpers/fetch_openai_embeddings_api");
const { sendApiChatRequest } = require("../../helpers/retrieval_augmented_generation");
const { fetchOpenAIEmbeddings } = fetchEmbedding;
const pgvector = require('pgvector/pg');
const { client, connectClient } = require('../../helpers/connection.js');

// Middleware to parse JSON request bodies
app.use(express.json());

// Define the search endpoint
app.post('/search', async (req, res) => {
  try {
    // Ensure DB connection
    await connectClient();

    // Register pgvector type
    await pgvector.registerType(client);

    // Extract the input text from the request body
    const inputText = req.body.inputText;

    // Get the vectorized input from OpenAI
    const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(inputText);
    const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
    const vdbResponse = await vectorSearch(vectorizedInputFromUser);


    const headersKeys = Object.keys(vdbResponse[0]).filter((key) => !key.includes('_vector'));
    const headers = headersKeys.join(' | ');
    const vdbResults = vdbResponse.map(row => headersKeys.map(key => row[key]).join(' | ')).join('\n');

    const ragMessage = `Skriv en respons som finner det mest korresponderende datasettet fra metadata for spørringen:\nSpørring:${inputText}\nVektor Database Resultater:\n${headers}\n${vdbResults}`;
    const messages = [
      { role: "user", content: ragMessage }
    ];
    const fullRagResponse = await sendApiChatRequest(messages);
    console.log(`\n\nThis is the full RAG response: ${fullRagResponse}`);

    
    // Search for the closest vectors in the database, and respond with the results
    res.json(response)


  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});



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
