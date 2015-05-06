var _ = require('lodash'),
    config = require('../../config/env'),
    
    ModelResource = require('./_modelResource'),
    Product = require('../../models/product'),

    UserMailer = require('../../mailers/user');

var ProductResource = ModelResource.extend({

  limit: 100,

  Model: Product,

  where: {
    isActive: true,
    isPublic: true
  }

});


module.exports = ProductResource;