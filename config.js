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
    table_to_use: 'text_embedding_3_large'
  },
  api: {
    openai_embedding_api_key: 'sk-',
    model: 'text-embedding-3-large',
    openai_organisation_id : 'org-',
    openai_gpt_api_key : 'sk-',
    openai_gpt_api_model : 'gpt-4o',
  }
};

module.exports = config;
