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

  code: {
    required: true,
    type: 'string',
    unique: true
  },

  discount: {
    required: true,
    type: 'float'
  },

  discountType: {
    required: true,
    type: 'string'
  },

  expirationDate: {
    defaultsTo: null,
    type: 'datetime'
  },

  usesRemaining: {
    defaultsTo: 0,
    type: 'integer'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  applyDiscount: function(price) {
    if (this.discountType === 'percent') {
      return parseFloat(price  - (price * (this.discount / 100)));
    } else if (this.discountType === 'flat') {
      return price - this.discount;
    }
  },

  isValid: function() {
    return (this.expirationDate && !this.isExpired()) || this.usesRemaining;
  },

  isExpired: function() {
    return this.expirationDate ? new Date(this.expirationDate) > new Date() : false;
  },

  toJSON: function() {
    var obj = _.clone(this.toObject());

    obj.isExpired = this.isExpired();
    obj.isValid = this.isValid();

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var PromoCode = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'promocode',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = PromoCode;