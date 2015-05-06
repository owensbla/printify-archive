var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App,
    Product = require('../models/product');

var Products = Backbone.Collection.extend({

  comparator: 'price',

  model: Product,

  urlFragment: 'product'

});

module.exports = Products;