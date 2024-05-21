# GeoGPT
Search function for "Kartverket"

## Setup of RAG chat
### Installation 
1. Setup and start `Docker Desktop`
2. Start 3 terminal windows, and open the first terminal in the root folder (`GeoGPT folder`)
3. In the first terminal window, run these commands to set everything up
   - ```npm i``` (installs required node packages)
   - ```npm i -g http-server``` (installs module globally required for the server)
   - Mac/linux: ```sudo sh run_pgvector.sh```
   - Windows: ```run_pgvector.bat```
   - ```node vector_creation/create_vector.js``` (creates embeddings)
   - ```node vector_insertion/insert_csv.js``` (creates table and inserts embeddings)
4. Navigate the second terminal window to the folder `chat/server` and run ```node index.js```
5. Navigate the final terminal window to the folder `chat/app` and run ```http-server```
### The chat client should be available on the links presented by the `http-server` command
<br>



## Setup of vector database demo
### Installation 
1. Setup and start docker
2. Start run_pgvector (found in /PGVDocker)
   - Mac/linux: ```sudo sh run_pgvector.sh```
   - Windows: ```run_pgvector.bat```
3. Connect to the database (see password in run_pgvector.sh)
   - host:localhost
   - port:5432
   - user:asd
   - password:asd
   - database:postgres
4. Run ```vdb_setup.sql```
5. Run ```npm i``` in terminal (root folder)
6. Run insert_csv.js in the folder "vector_insertion" (```node insert_csv.js```)
7. Populate the config with api key
8. Navigate to src/private and run node vector_search.js
9. Navigate to src/public and open search_geo_norge.html in browser

### Queries
See [pgvector](https://github.com/pgvector/pgvector?tab=readme-ov-file#docker)