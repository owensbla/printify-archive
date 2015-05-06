var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App;

var MarketplaceProduct = Backbone.Model.extend({

  defaults: {},

  getFramedPosters: function() {
    return _.filter(this.get('variations'), function(v) { return v.product.slug === 'framed-poster'; });
  },

  getPosters: function() {
    return _.filter(this.get('variations'), function(v) { return v.product.slug === 'poster'; });
  },

  toJSON: function() {
    var attrs = _.clone(this.attributes);

    return attrs;
  },

  urlFragment: 'marketplace',

});

module.exports = MarketplaceProduct;