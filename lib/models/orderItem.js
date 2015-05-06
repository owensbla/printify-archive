/**
 * OrderItem Model
 *
 * A single item from an order.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    moment = require('moment');

/* Attributes (fields on the model) */
var Attributes = {

  externalId: {
    defaultsTo: null,
    type: 'integer'
  },

  externalPrice: {
    defaultsTo: null,
    type: 'float'
  },

  lineItemId: {
    defaultsTo: null,
    type: 'integer'
  },

  product: {
    model: 'product',
    required: true
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

  photo: {
    model: 'photo',
    required: true
  },

  size: {
    defaultsTo: null,
    type: 'string'
  },

  order: {
    model: 'order',
    required: true
  },

  user: {
    model: 'user',
    required: true
  },

  shipment: {
    defaultsTo: null,
    model: 'shipment'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  getFormattedModel: function() {
    if (this.model === 'Canvas') return 'Canvas Print';
    return this.model;
  },

  getFormattedCreatedAt: function() {
    return moment(this.createdAt).format('MMMM Do, YYYY');
  },

  getFormattedPrice: function() {
    return '$' + parseFloat(this.price).toFixed(2);
  },

  toJSON: function() {
    var obj = _.clone(this.toObject());

    delete obj.externalPrice;
    delete obj.externalId;
    delete obj.provider;

    obj.formattedModel = this.getFormattedModel();
    obj.formattedCreatedAt = this.getFormattedCreatedAt();
    obj.formattedPrice = this.getFormattedPrice();

    if (this.photo !== null && typeof this.photo === 'object') obj.photo = this.photo.toJSON();
    obj.shipment = false;
    if (this.shipment !== null && typeof this.shipment === 'object') obj.shipment = this.shipment.toJSON();

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var OrderItem = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'orderitem',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = OrderItem;