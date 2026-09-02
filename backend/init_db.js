const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDb() {
  // Connect to the default 'postgres' database to create our new db
  const client1 = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres'
  });

  try {
    await client1.connect();
    console.log("Connected to default postgres database.");
    
    // Check if database exists
    const res = await client1.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${process.env.DB_NAME}'`);
    if (res.rowCount === 0) {
      console.log(`Creating database ${process.env.DB_NAME}...`);
      await client1.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log("Database created.");
    } else {
      console.log("Database already exists.");
    }
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await client1.end();
  }

  // Now connect to the newly created database and run the sql script
  const client2 = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
  });

  try {
    await client2.connect();
    console.log(`Connected to ${process.env.DB_NAME} database.`);
    
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log("Executing database.sql script...");
    await client2.query(sql);
    console.log("Tables and sample data created successfully.");
  } catch (err) {
    console.error("Error executing sql script:", err);
  } finally {
    await client2.end();
  }
}

initDb();
