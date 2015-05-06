// Update with your config settings.
var config = require('./lib/config/env');

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host: config.database.host,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      ssl: config.database.ssl
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: 'lib/migrations',
      tableName: 'migrations'
    }
  },

  staging: {
    client: 'mysql',
    connection: {
      host: config.database.host,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      ssl: config.database.ssl
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: 'lib/migrations',
      tableName: 'migrations'
    }
  },

  production: {
    client: 'mysql',
    connection: {
      host: config.database.host,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      ssl: config.database.ssl
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: 'lib/migrations',
      tableName: 'migrations'
    }
  }

};
