const config = require('../config.js');
const { api: {model, openai_embedding_api_key} } = config;

const fetchOpenAIEmbeddings = async (inputText) => {
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
    throw new Error('Network response failed');
  }

  return response.json();
};

module.exports = { fetchOpenAIEmbeddings };
