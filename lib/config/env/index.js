var _ = require('lodash');

/**
 * Load environment configuration
 */
module.exports = _.merge(
    require('./all'),
    process.env.NODE_ENV ? require('./' + process.env.NODE_ENV) : require('./development'));