/**
 * CartItem Model
 *
 * An item in a user's cart.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline');

/* Attributes (fields on the model) */
var Attributes = {

  isArchived: {
    defaultsTo: false,
    type: 'boolean'
  },

  order: {
    defaultsTo: null,
    model: 'order'
  },

  photo: {
    model: 'photo',
    required: true
  },

  product: {
    model :'product',
    required: true
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

    delete obj.isArchived;
    delete obj.order;

    if (typeof this.photo === 'object') obj.photo = this.photo.toJSON();
    if (typeof this.product === 'object') obj.product = this.product.toJSON();

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var CartItem = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'cartitem',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = CartItem;