/**
 * Product Model
 *
 * A product.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    Helpers = require('../helpers');

/* Attributes (fields on the model) */
var Attributes = {

  discount: {
    defaultsTo: 0,
    type: 'float'
  },

  externalId: {
    defaultsTo: null,
    type: 'integer'
  },

  externalSku: {
    detaultsTo: null,
    type: 'string'
  },

  externalPrice: {
    defaultsTo: null,
    type: 'float'
  },

  image: {
    required: true,
    type: 'string'
  },

  isActive: {
    defaultsTo: true,
    type: 'boolean'
  },

  isPublic: {
    defaultsTo: true,
    type: 'boolean'
  },

  model: {
    required: true,
    type: 'string'
  },

  name: {
    required: true,
    type: 'string'
  },

  price: {
    required: true,
    type: 'float'
  },

  provider: {
    defaultsTo: 'internal',
    type: 'string'
  },

  size: {
    defaultsTo: null,
    type: 'string'
  },

  slug: {
    defaultsTo: null,
    type: 'string'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  isOnSale: function() {
    return this.discount > 0;
  },

  getFormattedPrice: function() {
    return '$' + parseFloat(this.price);
  },

  getformattedSize: function() {
    return this.size + '"';
  },

  getFormattedModel: function() {
    if (this.model === 'Canvas') return 'Canvas Print';
    return this.model;
  },

  /* This method is called before sending the user data back to the client. */
  toJSON: function() {
    var obj = _.clone(this.toObject());

    delete obj.externalId;
    delete obj.externalSku;
    delete obj.isActive;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj.externalPrice;
    delete obj.discount;
    delete obj.provider;
    delete obj.isPublic;

    obj.salePrice = this.isOnSale() ? this.price - this.discount : false;
    obj.onSale = this.isOnSale();
    obj.formattedPrice = this.getFormattedPrice();
    obj.formattedSize = this.getformattedSize();
    obj.formattedModel = this.getFormattedModel();

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

  beforeValidate: function(values, next) {
    values.slug = Helpers.slugify(values.model);
    next();
  }

};

/* Create the Waterline.Collection */
var Product = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'product',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = Product;