var _ = require('lodash'),
    secrets = require('../secrets');

module.exports = _.merge({

  database: {
    defaultAdapter: 'localMysql',
    database: '',
    host: '',
    user: '',
    password: '',
    port: 3306,
    pool: false,
    ssl: true
  },

  domain: 'https://staging.printify.io',

  env: 'staging',

  s3BucketName: 'staging.printify.io',
  s3BucketUrl: 'https://s3-us-west-2.amazonaws.com/staging.printify.io/',

}, secrets.staging);