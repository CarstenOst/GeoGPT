const fs = require('fs');
const csvParser = require('csv-parser');
const pgvector = require("pgvector");
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'asd',
    password: 'asd',
    database: 'postgres'
  }
});

const tableName = 'text_embedding_3_large'; // Adjust according to your actual table name
const filePath = '../vector_creation/embeddings.csv'; // Adjust according to your actual file path

async function insertCSVData(filePath, tableName) {
  const dataToInsert = [];


  // Wrap in a Promise to handle async reading of the CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: '|' })) // Adjust the separator if needed
      .on('data', (row) =>  {dataToInsert.push(row);})
      .on('end', () =>      {resolve();})
      .on('error', (err) => {console.error('Error reading CSV file:', err);
        reject(err);
      });
  });

  // Insert data into the database, use async/await to wait for completion
  try {
    await knex(tableName).insert(dataToInsert);
    console.log('Data inserted successfully');
  } catch (err) {
    console.error('Error inserting data:', err);
  } finally {
    await knex.destroy(); // Ensure the database connection is closed
  }
}


insertCSVData(filePath, tableName);
