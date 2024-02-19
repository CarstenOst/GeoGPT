@echo off

REM Pull the pgvector Docker image
docker pull pgvector/pgvector:pg16

REM Run the Docker container
docker run -d --name pgvector_container ^
  -e POSTGRES_USER=myuser ^
  -e POSTGRES_PASSWORD=mysecretpassword ^
  -p 5432:5432 pgvector/pgvector:pg16

echo  pgvector PostgreSQL container is running.
