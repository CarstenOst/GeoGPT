@echo off

SET CONTAINER_NAME=pgvector_container
SET IMAGE_NAME=pgvector/pgvector:pg16

REM Stop the container if it's running
docker stop %CONTAINER_NAME% 2>nul

REM Remove the container if it exists
docker rm %CONTAINER_NAME% 2>nul

docker pull %IMAGE_NAME%

REM Run the Docker container
docker run -d --name %CONTAINER_NAME% ^
  -e POSTGRES_USER=asd ^
  -e POSTGRES_PASSWORD=asd ^
  -p 5432:5432 %IMAGE_NAME%

echo  pgvector PostgreSQL container is running.

echo Waiting for PostgreSQL to start...
timeout /t 10

echo Connecting to the database and executing setup SQL...
docker exec -i pgvector_container psql -U asd -d postgres -c "CREATE EXTENSION IF NOT EXISTS vector; CREATE TABLE IF NOT EXISTS text_embedding_3_large ( db_id SERIAL primary key, schema TEXT, uuid TEXT, id INT, hierarchyLevel TEXT, title TEXT, datasetcreationdate TEXT, abstract TEXT, keyword TEXT, geoBox TEXT, constraints TEXT, SecurityConstraints TEXT, LegalConstraints TEXT, temporalExtent TEXT, image TEXT, responsibleParty TEXT, link TEXT, metadatacreationdate TEXT, productInformation TEXT, parentId TEXT, title_vector vector(3072) );"

echo Setup SQL executed.

echo pgvector PostgreSQL container is running.
