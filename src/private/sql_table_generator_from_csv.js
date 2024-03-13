const fs = require('fs');
const Papa = require('papaparse');

// Synchronous read and parsing of the CSV file
function generateSqlFromCsv(filePath, tableName, vectorDimensions) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    // Parse synchronously since we already have the file content
    const parsed = Papa.parse(fileContent, { header: true,  delimiter: '|' });

    // Check if parsed.data is not empty to get column names
    if (parsed.data.length > 0) {
        const columnNames = Object.keys(parsed.data[0]); // Get column names from the first row's keys
        let sqlStatement = `CREATE TABLE ${tableName} (\n`;

        columnNames.forEach((name, index) => {
            let columnType = 'TEXT';
            if (name.toLowerCase().includes('vector')) {
                columnType = `VECTOR(${vectorDimensions})`; // Specify vector column type
            }

            sqlStatement += `  ${name} ${columnType}`;
            if (index < columnNames.length - 1) {
                sqlStatement += ',';
            }
            sqlStatement += '\n';
        });

        sqlStatement += ');';
        console.log(sqlStatement);
    } else {
        console.log("No data found in the CSV file.");
    }
}

// Example usage
generateSqlFromCsv('../../vector_creation/text-embedding-3-large_title-keyword.csv', 'text_embedding_3_large_title_keyword', 3072);
