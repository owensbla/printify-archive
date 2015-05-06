var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App,
    Order = require('../models/order');

var Order = Backbone.Collection.extend({

  comparator: '-createdAt',

  model: Order,

  urlFragment: 'order'

});

module.exports = Order;