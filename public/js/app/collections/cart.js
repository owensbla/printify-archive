var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App,
    CartItem = require('../models/cartItem');

var Cart = Backbone.Collection.extend({

  applyPromoCode: function(promoCode) {
    var _this = this,
        req;

    req = $.ajax({
      contentType: 'application/json',
      data: JSON.stringify(promoCode),
      dataType: 'json',
      type: 'POST',
      url: this.url() + '/apply-promo/',
    });

    return req;
  },

  getShippingRates: function(shippingAddress) {
    var _this = this,
        req, shippingParams;

    req = $.ajax({
      contentType: 'application/json',
      data: JSON.stringify(shippingAddress),
      dataType: 'json',
      type: 'POST',
      url: this.url() + '/shipping/',
    });

    return req;
  },

  checkout: function(orderBody) {
    var _this = this,
        req;

    req = $.ajax({
      contentType: 'application/json',
      data: JSON.stringify(orderBody),
      dataType: 'json',
      type: 'POST',
      url: this.url() + '/checkout/',
    });

    return req;
  },

  getSubtotal: function() {
    return parseFloat(_.reduce(this.models, function(memo, model) { return model.get('product').price + memo; }, 0.0));
  },

  getFormattedSubtotal: function() {
    return '$' + this.getSubtotal().toFixed(2);
  },

  model: CartItem,

  urlFragment: 'cart'

});

module.exports = Cart;