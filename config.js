const config = {
  app: {
    //port: 3000,
    name: 'GeoGPT'
  },
  db: {
    host: 'localhost',
    port: 5432,
    name: 'postgres',
    user: 'asd',
    password: 'asd',
  },
  api: {
    openai_embedding_api_key: 'sk-',
    model: 'text-embedding-3-large',
  }
};

module.exports = config;
