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

  collection: {
    model: 'marketplacecollection',
    required: false
  },

  description: {
    defaultsTo: null,
    type: 'text'
  },

  imageUrl: {
    required: true,
    type: 'string'
  },

  isActive: {
    defaultsTo: true,
    type: 'boolean'
  },

  model: {
    required: true,
    type: 'string'
  },

  title: {
    required: true,
    type: 'string'
  },

  slug: {
    defaultsTo: null,
    type: 'string'
  },

  variations: {
    collection: 'variation',
    via: 'marketplaceProduct'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  getMetaDescription: function() {
    return '';
  },

  getFormattedModel: function() {
    if (this.model === 'Canvas') return 'Canvas Print';
    return this.model;
  },

  getFullImageUrl: function() {
    return config.s3BucketUrl + this.imageUrl;
  },
  
  /* This method is called before sending the user data back to the client. */
  toJSON: function() {
    var obj = _.clone(this.toObject());

    delete obj.isActive;
    delete obj.createdAt;
    delete obj.updatedAt;

    obj.description = unescape(obj.description);
    obj.metaDescription = this.getMetaDescription();
    obj.fullImageUrl = this.getFullImageUrl();
    obj.formattedModel = this.getFormattedModel();
    obj.variations = _.map(this.variations, function(v) { return typeof v === 'object' ? v.toJSON() : v; });
    if (typeof _.first(obj.variations) === 'object') {
      obj.posters = _.filter(obj.variations, function(v) { return v.product.model === 'Poster'; });
      obj.framedPosters = _.filter(obj.variations, function(v) { return v.product.model === 'Framed Poster'; });
      obj.canvases = _.filter(obj.variations, function(v) { return v.product.model === 'Canvas'; });
    } else {
      obj.posters = [];
      obj.framedPosters = [];
      obj.canvases = [];
    }
    obj.collection = this.collection ? this.collection.toJSON() : false;

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

  beforeValidate: function(values, next) {
    values.slug = Helpers.slugify(values.title);
    next();
  }

};

/* Create the Waterline.Collection */
var MarketplaceProduct = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'marketplaceproduct',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = MarketplaceProduct;