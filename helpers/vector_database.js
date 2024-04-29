const pgvector = require('pgvector/pg');
const { fetchOpenAIEmbeddings } = require("./fetch_openai_embeddings_api.js");
const { client, connectClient } = require('./connection.js');

// Connect and register the client type
connectClient();
pgvector.registerType(client);


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


async function getVdbResponse(userQuestion) {
    const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(userQuestion);
    const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
    const vdbResponse = await RagVectorSearch(vectorizedInputFromUser);

    return vdbResponse;
}

async function getVdbSearchResponse(query) {
    const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(query);
    const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
    const vdbResponse = await vectorSearch(vectorizedInputFromUser);

    return vdbResponse;
}


module.exports = { vectorSearch, RagVectorSearch, getVdbResponse, getVdbSearchResponse };