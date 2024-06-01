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

const {toSql} = require('pgvector');
const database_table_name = "text_embedding_3_large_all";
const filepath_to_data_to_insert = "./full_dataset_vectorized_titles.json"


function toSnakeCase(str) {
    return str.replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase()).replace(/^_/, "");
}

/**
 * Assumes that all the data is PascalCase (because it is)
 *
 * @param filePath
 * @returns {Promise<void>}
 * Hardcoded excludes based on the data retrieved form geonorge
 * Excludes: ["serie_datasets", "serie", "type_name", "distribution_name", "service_datasets"]
 */
async function insertDataFromJson(filePath) {
    // Read the JSON file asynchronously
    const fileData = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);

    // Check if 'Results' key exists and it is an array
    if (jsonData && Array.isArray(jsonData)) {
        const batches = []; // Store batches of records
        const batchSize = 100; // Define the size of each batch

        // Insert data into the database
        for (const item of jsonData) {
            const insertObject = {};
            Object.keys(item).forEach(key => {
                const snakeKey = toSnakeCase(key);
                if (!["serie_datasets", "serie", "type_name", "distribution_name", "service_datasets"].includes(snakeKey)) {
                    if (item[key] !== undefined && item[key] !== null) {
                        if (snakeKey === 'title_vector') {
                            // Convert the title_vector using pgvector's method
                            // All it does is add "[" at the front and "]" at the end
                            insertObject[snakeKey] = toSql(item[key]);
                        } else {
                            insertObject[snakeKey] = item[key];
                        }
                    }
                }
            });

            batches.push(insertObject);
            if (batches.length === batchSize) {
                await knex(database_table_name).insert(batches);
                batches.length = 0; // Clear the batch
            }
        }

        if (batches.length > 0) {
            await knex(database_table_name).insert(batches); // Insert any remaining records
        }

        console.log('Data inserted successfully');
    } else {
        console.error('No results found in JSON file');
    }
}

//insertDataFromJson('./all_datasets_and_articles.json').catch(console.error);
insertDataFromJson(filepath_to_data_to_insert).catch(console.error);
