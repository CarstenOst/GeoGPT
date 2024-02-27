const fs = require('fs');
const csv = require('csv-parser');

// Specify the CSV file name
const csvFileName = 'output.csv';

// Specify the column title you are interested in
const columnTitle = 'keyword';

// Create a stream to read the CSV file
fs.createReadStream(csvFileName)
    .pipe(csv({
        separator: '|', // Specify the delimiter here
    }))
    .on('data', (row) => {
        // Check if the column exists in the current row
        if (row[columnTitle] !== undefined) {
            // Or, if you just want to print the value of the specific column, use:
            console.log(row[columnTitle]);
        }
    })
    .on('end', () => {
        console.log('CSV file successfully processed');
    })
    .on('error', (err) => {
        console.error('Error reading CSV file:', err);
    });
