var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone');

// fixes an 'undefined is not a function' error
Backbone.$ = $;

// require vendor modules
require('./vendor/backbone.queryparams');
require('./vendor/backbone.queryparams-shim');

// require lib modules
require('./lib/backbone.dinghy');

window.Backbone = Backbone;
window._ = _;
window.$ = window.jQuery = $;

var Router = Backbone.Router.extend({

  routes: {
    'a/marketplace/new': 'createMarketplaceProductRoute',
    'a/marketplace/new/': 'createMarketplaceProductRoute'
  },

  before: function() {},
  after: function() {},
  authenticate: function() { return true; },
  authorize: function() { return true; },

  createMarketplaceProductRoute: function() {
    new CreateMarketplaceProductView();
  }

});

// CREATE MARKETPLACE PRODUCT
var CreateMarketplaceProductView = Backbone.View.extend({

  events: {
    'click .js-add-variation': 'addVariation'
  },

  initialize: function() {
    this.setElement($('.content'));
  },

  addVariation: function(e) {
    e.preventDefault();
    var $clone = this.$('.js-variation').last().clone();
    this.$('.js-variations').append($clone);
  }

});

new Router();
Backbone.history.start({ pushState: true });