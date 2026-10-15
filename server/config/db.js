const knex = require('knex');
const path = require('path');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const dbUrl = process.env.DATABASE_URL;

let knexConfig;

if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
  knexConfig = {
    client: 'pg',
    connection: {
      connectionString: dbUrl,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    },
    pool: { min: 2, max: 10 }
  };
} else if (isTest) {
  knexConfig = {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  };
} else {
  const dbPath = path.resolve(__dirname, '../../hunarhub.sqlite');
  knexConfig = {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  };
}

const db = knex(knexConfig);

module.exports = db;
