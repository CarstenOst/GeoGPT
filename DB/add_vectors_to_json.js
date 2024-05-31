const config = require("../config");
const { fetchOpenAIEmbeddings } = require("../helpers/fetch_openai_embeddings_api.js");
const { api: { model } } = config; // Assuming this is how your model is configured
const fs = require('fs').promises;

async function processJsonFile(inputFilePath = "./test.json", outputFilePath = "output.json", batchSize = 500) {
    try {
        console.log("Starting to read the JSON file...");
        const data = await fs.readFile(inputFilePath, 'utf8');
        let jsonData = JSON.parse(data);
        console.log("File read successfully!");

        // Function to split data into batches
        const batches = createBatches(jsonData.Results, batchSize);

        console.log(`Processing in batches of ${batchSize}...`);
        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1} of ${batches.length}`);
            const titles = batches[i].map(result => result.Title);
            const embeddings = await fetchOpenAIEmbeddings(titles); // Assume this now returns a JavaScript object directly
            batches[i].forEach((result, index) => {
                result.title_vector = embeddings.data[index].embedding; // Assuming the structure includes an 'embedding' array
            });
        }

        // Flatten the batches back into the results
        jsonData.Results = batches.flat();

        console.log("Writing updated data back to the output file...");
        await fs.writeFile(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log('JSON file has been updated and saved successfully.');
    } catch (err) {
        console.error('An error occurred:', err);
    }
}

function createBatches(data, batchSize) {
    let batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
        batches.push(data.slice(i, i + batchSize));
    }
    return batches;
}

processJsonFile().then(() => console.log("Batch processing complete!"));
