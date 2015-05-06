/**
 * Shipment Model
 *
 * A shipment of order items.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    moment = require('moment');

/* Attributes (fields on the model) */
var Attributes = {

  externalId: {
    required: true,
    type: 'integer'
  },

  carrier: {
    required: true,
    type: 'string'
  },

  service: {
    required: true,
    type: 'string'
  },

  trackingNumber: {
    required: true,
    type: 'string'
  },

  trackingUrl: {
    required: true,
    type: 'string'
  },

  shipDate: {
    required: true,
    type: 'string'
  },

  reshipment: {
    defaultsTo: false,
    type: 'boolean'
  },

  orderItems: {
    collection: 'orderitem',
    via: 'shipment'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  getFormattedShipDate: function() {
    return moment(this.shipDate).format('MMMM Do, YYYY');
  },

  toJSON: function() {
    var obj = _.clone(this.toObject());

    obj.formattedShipDate = this.getFormattedShipDate();

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var Shipment = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'shipment',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = Shipment;