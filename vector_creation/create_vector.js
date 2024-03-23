const fetchEmbedding= require("../helpers/fetch_openai_embeddings_api");
const config = require('../config.js');
const csv = require('fast-csv');
const fs = require('fs'); // stream-based operations
const fsPromises = fs.promises; // file operations
const { api: {model} } = config;
const { fetchOpenAIEmbeddings } = fetchEmbedding;


async function readCombinedColumnsFromCSV(filePath, columnsToCombine) {
  const combinedTexts = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true, delimiter: '|' }))
        .on('error', error => reject(error))
        .on('data', row => {
          // Combine specified columns
          const combinedText = columnsToCombine.map(column => row[column]).join(" ");
          combinedTexts.push(combinedText);
        })
        .on('end', rowCount => resolve(combinedTexts));

  });
}


async function writeEmbeddingsToCSV(filePath, data) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    const csvStream = csv.format({
      headers: true,
      delimiter: '|'});
    csvStream.pipe(stream).on('end', () => resolve()).on('error', error => reject(error));

    data.forEach(row => {
      csvStream.write(row);
    });

    csvStream.end();
  });
}

/**
 * Fetch and write embeddings to a copy of the csv used
 * Note Delimiter is pipe '|'
 *
 * @param csvDatasetFilePath String of the dataset as csv filepath
 * @param titlesToCombine Array of titles to be used
 * @returns {Promise<string>}
 */
async function fetchAndLogEmbedding(csvDatasetFilePath, titlesToCombine) {
  try {

    const combinedTitles = await readCombinedColumnsFromCSV(csvDatasetFilePath, titlesToCombine)

    //console.log(titles);
    const csvFile = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvDatasetFilePath)
        .pipe(csv.parse({ headers: true, delimiter: '|' }))
        .on('error', error => reject(error))
        .on('data', row => csvFile.push(row))
        .on('end', rowCount => resolve(csvFile));
    });

    //return combinedTitles;
    // Fetch embeddings
    const embeddingResponse = await fetchOpenAIEmbeddings(combinedTitles);
    const embeddings = embeddingResponse.data; // Json

    // Combine the used dataset with the newly created vectors
    const dataForCSV = embeddings.map(embedding => ({
      ...csvFile[embedding.index], // WHAT IS THIS SORCERY!?
      combined_title_vector: JSON.stringify(embedding.embedding)

    }));
    console.log('Here is data for CSV')
    //console.log(dataForCSV);
    // Assuming embeddings.csv is your target CSV file
    await writeEmbeddingsToCSV(`./${model}.csv`, dataForCSV);
    console.log('Embeddings written to CSV.');

  } catch (error) {
    console.error('Error:', error);
  }
}
//fetchAndLogEmbedding('embeddings.csv', ['title', 'keyword']).then(res => console.log(JSON.stringify(res))).catch(err => console.error(err));




async function appendColumnsEmbeddings(filePath, columnNames, outputFilename) {
  // Array for storage of 'original' dataset
  const rows = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true, delimiter: '|' }))
      .on('error', error => reject(error))
      .on('data', row => {
        rows.push(row);
      })
      .on('end', async () => {

        // Stores column row embeddings (columnName : [embeddingsArray])
        const columnEmbeddings = {};
        for (const columnName of columnNames) {
          // Gets the rows in array format
          const columnRows = rows.map(row => row[columnName]);

          // Sends row array to API, then stores embedding arrays for the column rows
          try {
              const embeddings = await fetchOpenAIEmbeddings(columnRows);
              const embeddingArrays = embeddings.data.map(element => element.embedding);
              columnEmbeddings[columnName + '_vector'] = embeddingArrays;
              
          } catch (error) {
              console.error(`Error fetching embeddings for ${columnName}:`, error);
          }
        };


        // Appends each extracted column with the embeddings header to the original rows
        const rowsWithModifiedColumns = rows.map((row, index) => {
          // "Imports" original row data using the spread operator
          const modifiedRow = { 
            ...row 
          };

          // Appends extracted embeddings array to the row, by index
          columnNames.forEach(columnName => {
            const modifiedColumnName = `${columnName}_vector`;
            modifiedRow[modifiedColumnName] = `[${columnEmbeddings[modifiedColumnName][index]}]`;
          });

          return modifiedRow;
        });


        // Write the new data to a CSV file
        const ws = fs.createWriteStream(outputFilename);
        csv.write(rowsWithModifiedColumns, { headers: true, delimiter: '|' }).pipe(ws);

        resolve();
      });
  });
}


// Appends columns with embeddings for 'columnsToVectorise', outputs to 'vectorisedColumnsDataset' filename with '|' separator
// Currently the API only accepts the three columns 'title', 'abstract', 'keyword'
const inputDatasetPath = '../cleaned_metadata.csv'
const columnsToVectorise = ['title', 'abstract', 'keyword']; //, 'geoBox', 'Constraints', 'SecurityConstraints', 'LegalConstraints', 'responsibleParty'];
const vectorisedColumnsDataset = 'all_columns_vectorized.csv';
appendColumnsEmbeddings(inputDatasetPath, columnsToVectorise, vectorisedColumnsDataset)
  .then(() => console.log('Columns extracted, modified, and new CSV file created.'))
  .catch(error => console.error('Error:', error));