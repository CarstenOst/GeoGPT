const fs = require('fs').promises;
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: 'asd',
        password: 'asd',
        database: 'postgres'
    }
});

function toSnakeCase(str) {
    return str.replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase()).replace(/^_/, "");
}


// Assumes that all the data is PascalCase (because it is)
async function insertDataFromJson(filePath) {
    // Read the JSON file asynchronously
    const fileData = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);

    // Check if 'Results' key exists and it is an array
    if (jsonData.Results && Array.isArray(jsonData.Results)) {
        const batches = []; // Store batches of records
        const batchSize = 100; // Define the size of each batch

        // Insert data into the database
        for (const item of jsonData.Results) {
            const insertObject = {};
            Object.keys(item).forEach(key => {
                const snakeKey = toSnakeCase(key);
                if (!["serie_datasets", "serie", "type_name", "distribution_name", "service_datasets"].includes(snakeKey)) {
                    if (item[key] !== undefined && item[key] !== null) {
                        insertObject[snakeKey] = item[key];
                    }
                }
            });

            batches.push(insertObject);
            if (batches.length === batchSize) {
                await knex('text_embedding_3_large_all').insert(batches);
                batches.length = 0; // Clear the batch
            }
        }

        if (batches.length > 0) {
            await knex('text_embedding_3_large_all').insert(batches); // Insert any remaining records
        }

        console.log('Data inserted successfully');
    } else {
        console.error('No results found in JSON file');
    }
}

insertDataFromJson('./all_datasets_and_articles.json').catch(console.error);
