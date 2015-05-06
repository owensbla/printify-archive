var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App;

var ProductsView = Backbone.View.extend({
  
  template: App.Templates['layouts/pages/products'],

  events: {
    'click .js-go-canvas': 'gotoCanvas',
    'click .js-go-framed-posters': 'gotoFramedPosters',
    'click .js-go-posters': 'gotoPosters'
  },

  initialize: function(opts) {
    this.router = opts.router;

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
    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  gotoCanvas: function(e) {
    e.preventDefault();
    this.router.navigate('products/canvas', { trigger: true, replace: false });
  },

  gotoFramedPosters: function(e) {
    e.preventDefault();
    this.router.navigate('products/framed-poster', { trigger: true, replace: false });
  },

  gotoPosters: function(e) {
    e.preventDefault();
    this.router.navigate('products/poster', { trigger: true, replace: false });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = ProductsView;