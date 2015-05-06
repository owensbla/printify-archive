/**
 * Transaction Model
 *
 * A transaction record.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline');

/* Attributes (fields on the model) */
var Attributes = {

  order: {
    model: 'order',
    required: true
  },

  processorId: {
    required: true,
    type: 'string'
  },

  status: {
    required: true,
    type: 'string'
  },

  statusCode: {
    defaultsTo: null,
    type: 'string'
  },

  statusNotes: {
    defaultsTo: null,
    type: 'string'
  },

  total: {
    required: true,
    type: 'float'
  },

  user: {
    model: 'user',
    required: true
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  toJSON: function() {
    var obj = _.clone(this.toObject());

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var Transaction = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'transaction',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = Transaction;