var _ = require('lodash'),
    secrets = require('../secrets'),
    port = require('./all').port;

module.exports = _.merge({
  
  database: {
    defaultAdapter: 'localMysql',
    database: 'printify',
    host: '127.0.0.1',
    user: 'root',
    password: '',
    port: 3306,
    pool: false,
    ssl: false
  },

  domain: 'http://localhost:' + port,

  env: 'development',

  s3BucketName: 'development.printify.io',
  s3BucketUrl: 'https://s3-us-west-2.amazonaws.com/development.printify.io/',

}, secrets.development);