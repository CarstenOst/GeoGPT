const fetch = require("node-fetch");
const config = require('../config.js');
const { api: {model, openai_embedding_api_key} } = config;
const fs = require('fs');



const fetchOpenAIEmbeddings = async (inputText) => {
  console.time("Openai embedding response")
  //appendToCsv(inputText);
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openai_embedding_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: inputText,
      model: model,
      encoding_format: "float"
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Network response failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  console.timeEnd("Openai embedding response")

  return response.json();
};

module.exports = { fetchOpenAIEmbeddings };


function appendToCsv(stringInput){
  fs.appendFile('./sokLog.csv', stringInput + '\n', (err) => {
    if (err) {
      console.error('Error appending to the CSV file:', err);
      return;
    }

    console.log('Successfully appended to the CSV file.');
  });
}
