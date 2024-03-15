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