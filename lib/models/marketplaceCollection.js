/**
 * Marketplace Collection Model
 *
 * A collection of products on the Marketplace.
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

  name: {
    required: true,
    type: 'string'
  },

  products: {
    collection: 'marketplaceproduct',
    via: 'collection'
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

    if (this.products) {
      obj.products = _.map(this.products, function(p) { return typeof p === 'object' ? p.toJSON() : p; });
    }

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var MarketplaceCollection = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'marketplacecollection',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = MarketplaceCollection;