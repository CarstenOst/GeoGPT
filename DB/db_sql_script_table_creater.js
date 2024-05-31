const fs = require('fs');


// Read the JSON file
fs.readFile('all_datasets_and_articles.json', 'utf-8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    // Parse the JSON data
    let jsonData;
    try {
        jsonData = JSON.parse(data);
    } catch (parseError) {
        console.error("Error parsing JSON data:", parseError);
        return;
    }

    // Check if the 'Results' array is present and not empty
    if (!jsonData.Results || !Array.isArray(jsonData.Results) || jsonData.Results.length === 0) {
        console.error("No results found or 'Results' is not an array.");
        return;
    }

    // Use the first object from the 'Results' array to define the table structure
    const sampleObject = jsonData.Results[0];
    const tableName = "Datasets"; // Customize your table name here
    let sqlScript = `CREATE TABLE ${tableName}
    (`;

    // Generate SQL schema for each key in the JSON object
    Object.keys(sampleObject).forEach((key, index, array) => {
        sqlScript += ` ${key} TEXT${index < array.length - 1 ? ',' : ''}\n`;
    });

    sqlScript += ");";

    // Output the CREATE TABLE statement to the console
    console.log(sqlScript);
});
