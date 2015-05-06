var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App,

    OrderItem = require('./orderItem');

var Order = Backbone.Model.extend({

  defaults: {},

  toJSON: function() {
    var attrs = _.clone(this.attributes);

    attrs.orderItems = _.map(attrs.orderItems, function(orderItem) { return new OrderItem(orderItem).toJSON(); });

    return attrs;
  },

  urlFragment: 'order',

});

module.exports = Order;