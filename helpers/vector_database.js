const pgvector = require('pgvector/pg');
const { fetchOpenAIEmbeddings } = require("./fetch_openai_embeddings_api.js");
const { client, connectClient } = require('./connection.js');
const config = require('../config.js');
const { db: { table_to_use } } = config;


// Connect and register the client type
connectClient();
pgvector.registerType(client);


// Function for the search box
async function vectorSearch(vectorArray){
    console.time("VectorSearch")
    // Perform the search with the vectorized input
    const searchVector = [pgvector.toSql(vectorArray)];
    const { rows } = await client.query(
      `SELECT uuid, title, type, title_vector  <-> $1 AS distance 
         FROM ${table_to_use} 
         WHERE type = 'dataset'
         ORDER BY title_vector <-> $1 LIMIT 60`,
      searchVector
    );
    console.timeEnd("VectorSearch")
    return rows;
}

// Search function used for RAG
async function RagVectorSearch(vectorArray){
    // Perform the search with the vectorized input
    const searchVector = [pgvector.toSql(vectorArray)];
    const { rows } = await client.query(
      `SELECT uuid, title, abstract, image, title_vector <-> $1 AS distance 
         FROM ${table_to_use} 
         ORDER BY title_vector <-> $1 LIMIT 3`,
      searchVector
    );
  
    return rows;
}


async function getVdbResponse(userQuestion) {
    const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(userQuestion);
    const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
    return await RagVectorSearch(vectorizedInputFromUser);
}

async function getVdbSearchResponse(query) {
    const jsonInputFromOpenAi = await fetchOpenAIEmbeddings(query);
    const vectorizedInputFromUser = jsonInputFromOpenAi.data[0].embedding;
    return await vectorSearch(vectorizedInputFromUser);
}


module.exports = { vectorSearch, RagVectorSearch, getVdbResponse, getVdbSearchResponse };