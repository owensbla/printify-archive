var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App,
    MarketplaceProduct = require('../models/marketplaceProduct');

var MarketplaceProducts = Backbone.Collection.extend({

  comparator: 'createdAt',

  model: MarketplaceProduct,

  urlFragment: 'marketplace'

});

module.exports = MarketplaceProducts;