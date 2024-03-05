const pgvector = require('pgvector/pg');

// Import the client and connectClient function from connection.js
const { client, connectClient } = require('../helpers/connection.js');

// Headless function, could add a function name for more readability, but but
(async () => {
    try {
        // DB connected
        await connectClient();

        // Create the vector extension
        await client.query('CREATE EXTENSION IF NOT EXISTS vector');
        await pgvector.registerType(client);

        // Basic setup
        await client.query('DROP TABLE IF EXISTS pg_items');
        await client.query('CREATE TABLE pg_items (id serial PRIMARY KEY, embedding vector(3))');

        // Vectors to populate in the VDB
        const params = [
            pgvector.toSql([1, 1, 1]),
            pgvector.toSql([2, 2, 2]),
            pgvector.toSql([2, 24, 24]),
            pgvector.toSql([2, 21, 2]),
            pgvector.toSql([2, 2124, 2]),
            pgvector.toSql([32, 223, 2]),
            pgvector.toSql([2, 24, 2]),
            pgvector.toSql([1, 1, 24]),
            null
        ];

        // Inserts
        await client.query('INSERT INTO pg_items (embedding) VALUES ($1), ($2), ($3), ($4), ($5), ($6), ($7), ($8), ($9)', params);

        // Searches
        const searchVector = [pgvector.toSql([1, 1, 1])]
        const { rows } = await client.query(
            `SELECT id, embedding, embedding <-> $1 
                AS distance 
                FROM pg_items 
                ORDER BY embedding <-> $1 LIMIT 5`,
            searchVector
        );
        // Show the search result
        console.log('Query Results:', rows);

        // Indexes for faster search
        await client.query('CREATE INDEX ON pg_items USING hnsw (embedding vector_l2_ops)');
        // or IVFFLAT (uses less memory and might be faster, but is less accurate, therefore hnsw is the current method
        // that we use
        //await client.query('CREATE INDEX ON pg_items USING ivfflat (embedding vector_l2_ops) WITH (lists = 100)');

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the client connection
        await client.end();
    }
})();
