var _ = require('lodash'),
    config = require('../../config/env'),
    
    OwnerResource = require('./_ownerResource'),
    CreditCard = require('../../models/creditCard');

var CreditCardResource = OwnerResource.extend({

  Model: CreditCard,

  readOnlyFields: [
    'braintreeId',
    'maskedNumber',
    'last4',
    'user'
  ],

  where: {}

});


module.exports = CreditCardResource;