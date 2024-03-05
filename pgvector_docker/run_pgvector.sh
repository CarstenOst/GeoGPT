#!/bin/bash

#   Pull the pgvector Docker image
docker pull pgvector/pgvector:pg16

#   Run the Docker container
docker run -d --name pgvector_container \
  -e POSTGRES_USER=asd \
  -e POSTGRES_PASSWORD=asd \
  -p 5432:5432 pgvector/pgvector:pg16

echo "pgvector PostgreSQL container is running."

echo "Waiting for PostgreSQL to start..."
sleep 10

# Connect to the database and execute setup SQL
echo "Connecting to the database and executing setup SQL..."
docker exec -i pgvector_container psql -U asd -d postgres <<EOF
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS text_embedding_3_large
(
    db_id                SERIAL primary key,
    schema               TEXT,
    uuid                 TEXT,
    id                   INT,
    hierarchyLevel       TEXT,
    title                TEXT,
    datasetcreationdate  TEXT,
    abstract             TEXT,
    keyword              TEXT,
    geoBox               TEXT,        
    constraints          TEXT,
    SecurityConstraints  TEXT,
    LegalConstraints     TEXT,
    temporalExtent       TEXT,
    image                TEXT,
    responsibleParty     TEXT,
    link                 TEXT,
    metadatacreationdate TEXT,
    productInformation   TEXT,
    parentId             TEXT,        
    title_vector         vector(3072) 
);
EOF

echo "Setup SQL executed."

echo "pgvector PostgreSQL container is running."