const { Client } = require('pg');
const config = require('../config.js');
const { db: { host, port, name, user, password } } = config;

// Configuration for your database connection
const client = new Client({
  user: user,
  host: host,
  database: name,
  password: password,
  port: port,
});

let connected = false;

function connectClient() {
  if (!connected) {
    client.connect(err => {
      if (err) {
        console.log("Connection failed to the database");
        console.log("Please remember to make sure your database connection setup is correct");
        //console.error('connection error', err.stack);
        process.exit();
      } else {
        console.log('connected to postgres');
        connected = true;
      }
    });
  } else {
    console.log('Client is already connected.');
  }
}

module.exports = { client, connectClient };
