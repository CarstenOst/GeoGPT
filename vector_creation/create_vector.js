const fetchEmbedding = require("../helpers/fetch_openai_embeddings_api");
const { fetchOpenAIEmbeddings } = fetchEmbedding;
const fs = require('fs'); // Import fs for stream-based operations
const fsPromises = fs.promises; // Use fs.promises for promise-based file operations
const csv = require('fast-csv'); // Ensure fast-csv is installed

async function readTitlesFromCSV(filePath) {
  const titles = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv.parse({ headers: true, delimiter: '|' }))
      .on('error', error => reject(error))
      .on('data', row => titles.push(row.title))
      .on('end', rowCount => resolve(titles));
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

async function fetchAndLogEmbedding() {
  try {
    // Assuming titles.csv is your file with titles
    const titlesFilePath = './cleaned_metadata.csv';
    const titles = await readTitlesFromCSV(titlesFilePath);
    //console.log(titles);
    const csvfile = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(titlesFilePath)
        .pipe(csv.parse({ headers: true, delimiter: '|' }))
        .on('error', error => reject(error))
        .on('data', row => csvfile.push(row))
        .on('end', rowCount => resolve(csvfile));
    });


    // Fetch embeddings for all titles
    const embeddingResponse = await fetchOpenAIEmbeddings(titles);



    const embeddings = embeddingResponse.data; // Json

    // Prepare data for CSV by keeping the title
    const dataForCSV = embeddings.map(embedding => ({
      ...csvfile[embedding.index], // WHAT IS THIS MAGIC?
      title_vector: JSON.stringify(embedding.embedding)

    }));
    console.log('Here is data for CSV')
    console.log(dataForCSV);

    // Assuming embeddings.csv is your target CSV file
    await writeEmbeddingsToCSV('./embeddings.csv', dataForCSV);
    console.log('Embeddings written to CSV.');

  } catch (error) {
    console.error('Error:', error);
  }
}

fetchAndLogEmbedding();
