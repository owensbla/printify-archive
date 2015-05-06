/**
 * Marketplace Product Model
 *
 * A product on the Marketplace.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    Helpers = require('../helpers');

/* Attributes (fields on the model) */
var Attributes = {

  isActive: {
    defaultsTo: true,
    type: 'boolean'
  },

  photo: {
    model: 'photo',
    required: true
  },

  marketplaceProduct: {
    model: 'marketplaceproduct',
    required: true
  },

  product: {
    model: 'product',
    required: true
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  /* This method is called before sending the user data back to the client. */
  toJSON: function() {
    var obj = _.clone(this.toObject());

    delete obj.isActive;
    delete obj.createdAt;
    delete obj.updatedAt;

    // obj.product = typeof obj.product  === 'object' ? obj.product.toJSON() : obj.product;
    // obj.image = typeof obj.image  === 'object' ? obj.image.toJSON() : obj.image;

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var Variation = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'variation',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = Variation;