const fetchEmbedding = require("../../helpers/fetch_openai_embeddings_api");
const { fetchOpenAIEmbeddings } = fetchEmbedding;
const pgvector = require('pgvector/pg');

// Import the client and connectClient function from connection.js
const { client, connectClient } = require('../../helpers/connection.js');

// Headless function, could add a function name for more readability, but but
(async () => {
  try {
    // DB connected
    await connectClient();

    // Create the vector extension
    await pgvector.registerType(client);

    // Get the vectorized input from the user
    const vectorizedInputFromUser = fetchOpenAIEmbeddings["inputText"];

    // Searches
    const searchVector = [pgvector.toSql(vectorizedInputFromUser)]
      const { rows } = await client.query(
      `SELECT id, title, title_vector <-> $1 
                AS distance 
                FROM text_embedding_3_large 
                ORDER BY title_vector <-> $1 LIMIT 5`,
      searchVector
    );
    // Show the search result
    console.log('Query Results:', rows);

    // Indexes for faster search (max 2000 dimensions)
    //await client.query('CREATE INDEX ON text_embedding_3_large USING hnsw (title_vector vector_l2_ops)');
    // or IVFFLAT (uses less memory and might be faster, but is less accurate, therefore hnsw is the current method
    // that we use
    //await client.query('CREATE INDEX ON text_embedding_3_large USING ivfflat (title_vector vector_l2_ops) WITH (lists = 100)');

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the client connection
    await client.end();
  }
})();
