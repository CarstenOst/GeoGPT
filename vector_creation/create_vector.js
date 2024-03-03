const fetchEmbedding =  require("../helpers/fetch_openai_embeddings_api");
const {fetchOpenAIEmbeddings} = fetchEmbedding

const config = require('../config.js');
const { api: { openai_embedding_api_key } } = config;

const fs = require('fs').promises;


async function fetchAndLogEmbedding() {
  try {
    let embedding = await fetchOpenAIEmbeddings(['Artsfunn', 'Tilfluktsrom'], openai_embedding_api_key);
    console.log(embedding);

    // Path to your JSON file
    const filePath = './data.json';

    // Read the existing file or start with an empty array if the file does not exist
    let data = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      data = JSON.parse(fileContent);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error; // Ignore file not found error to start with an empty array
    }

    // Append the new data
    data.push(embedding);

    // Write the updated data back to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Embedding data appended to file.');

  } catch (error) {
    console.error('Error:', error);
  }
}

//fetchAndLogEmbedding();






async function appendDataFromJsonFile(targetFilePath, dataInput) {
  try {
    // Read and parse the source JSON file
    const sourceData = dataInput //await fs.readFile(sourceFilePath, 'utf8');
    const newEntry = sourceData

    // Attempt to read the target file and parse the JSON, or start with a new array/object if the file doesn't exist
    let jsonData;
    try {
      const data = await fs.readFile(targetFilePath, 'utf8');
      jsonData = JSON.parse(data);
    } catch (error) {
      // If the file does not exist or can't be read, determine a default structure based on newEntry
      jsonData = Array.isArray(newEntry) ? [] : {};
    }

    // Check if jsonData is an array or an object and append/merge accordingly
    if (Array.isArray(jsonData)) {
      // If jsonData is an array, append newEntry to it
      jsonData.push(newEntry);
      console.log('is array');

    } else if (typeof jsonData === 'object') {
      console.log('is array');
      // If jsonData is an object, merge or add newEntry as a new key
      // Example: Adding newEntry under a unique key. Adjust as needed.
      const newKey = `entry_${Date.now()}`; // Create a unique key based on the current timestamp
      jsonData[newKey] = newEntry;
    }

    // Write the modified JSON back to the file
    await fs.writeFile(targetFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('JSON data from ' + dataInput + ' appended to ' + targetFilePath + ' successfully.');
  } catch (error) {
    console.error('Error appending data:', error);
  }
}

// Example usage:
const targetFilePath = 'singular_vector.json';
const dataInput = {ev: 'yuh', evv: 'yuh'}
//appendDataFromJsonFile(targetFilePath, dataInput);

const addColumnToCsv = require('../helpers/add_csv_column.js');

const inputCsvFilePath = './csvtestcreation.csv';
const outputCsvFilePath = './output_file.csv';
const newColumnName = 'VectorColumn';
const defaultValue = 'nan';

// Call the function
addColumnToCsv(inputCsvFilePath, outputCsvFilePath, newColumnName, defaultValue);
