# GeoGPT
Search function for "Kartverket"

# Installation 
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


