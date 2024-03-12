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
fetchAndLogEmbedding('embeddings.csv', ['title', 'keyword']).then(res => console.log(JSON.stringify(res))).catch(err => console.error(err));


