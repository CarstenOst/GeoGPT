const config = require("../config");
const { fetchOpenAIEmbeddings } = require("../helpers/fetch_openai_embeddings_api.js");
const { api: { model } } = config; // Assuming this is how your model is configured
const JSONStream = require('JSONStream');
const fs = require('fs');
const { promises: fsPromises } = fs;


/**
 * Assumes titles are to be vectorized
 * Assumes that "Results" is the parent object to the wanted data
 * @param inputFilePath
 * @param outputFilePath
 * @param batchSize
 * @returns {Promise<void>}
 */
async function processJsonFile(inputFilePath = "./all_datasets_and_articles.json", outputFilePath = "output.json", batchSize = 500) {
    try {
        console.log("Starting to read the JSON file...");
        const data = await fsPromises.readFile(inputFilePath, 'utf8');
        let jsonData = JSON.parse(data);
        console.log("File read successfully!");

        const batches = createBatches(jsonData.Results, batchSize);

        console.log(`Processing in batches of ${batchSize}...`);
        const outputStream = fs.createWriteStream(outputFilePath);
        const stringifyStream = JSONStream.stringify();
        stringifyStream.pipe(outputStream);

        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1} of ${batches.length}`);
            const titles = batches[i].map(result => result.Title);
            const embeddings = await fetchOpenAIEmbeddings(titles); // Embeds titles
            batches[i].forEach((result, index) => {
                result.title_vector = embeddings.data[index].embedding;
                stringifyStream.write(result);
            });
        }

        stringifyStream.end();
        outputStream.on('finish', () => {
            console.log('JSON file has been updated and saved successfully.');
        });
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

/**
 * Some batching
 * @param data
 * @param batchSize
 * @returns {*[]}
 */
function createBatches(data, batchSize) {
    let batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
    }
    return batches;
}

processJsonFile().then(() => console.log("Batch processing complete!")); // Could be false positive ofc
