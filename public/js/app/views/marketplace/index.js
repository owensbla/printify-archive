var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App;

var MarketplaceView = Backbone.View.extend({
  
  template: App.Templates['layouts/pages/marketplace'],

  events: {
    'click .js-go-product': 'gotoProduct'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.collection = App.persist.get('marketplace');

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    if (App.state.get('initialLoad')) { this.bindEvents(); App.state.set('loading', false); return; }

    this.render().bindEvents();

    App.state.set('loading', false);
  },

  bindEvents: function() {
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    return this;
  },

  getContext: function() {
    var context = {};

    context.marketplaceProducts = this.collection.toJSON();

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  gotoProduct: function(e) {
    var $el = $(e.currentTarget),
        slug = $el.attr('data-slug');
  
    e.preventDefault();
    this.router.navigate('marketplace/' + slug, { trigger: true, replace: false });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = MarketplaceView;