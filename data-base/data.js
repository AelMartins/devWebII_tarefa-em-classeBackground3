const mssql = require("mssql");
require("dotenv").config({ path: "data-base/.env" });

const dbConfig = new mssql.ConnectionPool({
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  tchave: process.env.JWT_SECRET,
  cryptHash: process.env.BCRYPT_ROUNDS,
  port: 1434
});

module.exports = { dbConfig };
