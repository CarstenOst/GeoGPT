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

const tableName = 'text_embedding_3_large_rs'; // Adjust according to your actual table name
const filePath = '../vector_creation/text-embedding-3-large_title-keyword.csv'; // Adjust according to your actual file path

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


//insertCSVData(filePath, tableName);



async function insertCSVDataModified(filePath, tableName) {
  let dataToInsert = [];
  let headers = [];
  let createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (`;

  // Wrap in a Promise to handle async reading of the CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser({ separator: '|' })) // Adjust the separator if needed
      .on('headers', (receivedHeaders) => {
        headers = receivedHeaders;
        headers.forEach((header, index) => {
          if (header === 'id') {
            createTableQuery += `${header} INT,`;
          } else if (header.endsWith('_vector')) {
            createTableQuery += `${header} vector(3072),`;
          } else {
            createTableQuery += `${header} TEXT,`;
          }

          // Remove the last comma and add closing parenthesis
          if (index === headers.length - 1) {
            createTableQuery = createTableQuery.slice(0, -1) + ');'; 
          }
        });
        resolve();
      })
      .on('data', (row) =>  {dataToInsert.push(row);})
      .on('end', async () => {
        // Delete the existing table if it exists and create a new one
        try {
          await knex.raw(`DROP TABLE IF EXISTS ${tableName};`);
          await knex.raw(`CREATE EXTENSION IF NOT EXISTS vectors;`)
          await knex.raw(createTableQuery);
          console.log('Table created successfully');

          await knex.batchInsert(tableName, dataToInsert, 5);
          console.log('Inserted csv data successfully')

        } catch (err) {
          console.error('Error in creating table:', err);
        } finally {
          await knex.destroy();
        }

        resolve();
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err);
        reject(err);
      });
  });
 
}

// Call the function
insertCSVDataModified(filePath, tableName)
  .then(() => console.log('Operation completed.'))
  .catch(err => console.error('Error:', err));