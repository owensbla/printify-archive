var braintree = require('braintree'),
    config = require('../config/env');

module.exports = braintree.connect({
  environment: config.env === 'production' ? braintree.Environment.Production : braintree.Environment.Sandbox,
  merchantId: config.BRAINTREE.merchantId,
  publicKey: config.BRAINTREE.publicKey,
  privateKey: config.BRAINTREE.privateKey
});