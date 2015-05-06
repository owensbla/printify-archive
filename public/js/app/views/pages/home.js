var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App;

var HomePageView = Backbone.View.extend({
  
  template: App.Templates['layouts/pages/home'],

  events: {
    'click .js-go-products': 'gotoProducts',
    'click .js-go-canvas': 'gotoCanvas',
    'click .js-go-posters': 'gotoPosters',
    'click .js-go-framed-posters': 'gotoFramedPosters',
    'click .js-go-marketplace': 'gotoMarketplace',
    'click .js-go-marketplace-product': 'gotoMarketplaceProduct'
  },

  initialize: function(opts) {
    this.router = opts.router;

    this.setElement(Globals.CONTENT_ELEMENT);

    this.onReady();
  },

  onReady: function() {
    if (App.state.get('initialLoad')) { this.bindEvents(); App.state.set('loading', false); return; }

    this.render().bindEvents();

    $('body').addClass('is-landing');

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

  gotoProducts: function(e) {
    e.preventDefault();
    this.router.navigate('products', { trigger: true, replace: false });
  },

  gotoCanvas: function(e) {
    e.preventDefault();
    this.router.navigate('products/canvas', { trigger: true, replace: false });
  },

  gotoPosters: function(e) {
    e.preventDefault();
    this.router.navigate('products/poster', { trigger: true, replace: false });
  },

  gotoFramedPosters: function(e) {
    e.preventDefault();
    this.router.navigate('products/framed-poster', { trigger: true, replace: false });
  },

  gotoMarketplace: function(e) {
    e.preventDefault();
    this.router.navigate('marketplace', { trigger: true, replace: false });
  },

  gotoMarketplaceProduct: function(e) {
    var $el = $(e.currentTarget),
        slug = $el.attr('data-slug');

    e.preventDefault();
    this.router.navigate('marketplace/' + slug, { trigger: true, replace: false });
  },

  onClose: function() {
    $('body').removeClass('is-landing');
    this.unbindEvents();
  }

});

module.exports = HomePageView;