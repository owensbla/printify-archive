var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App,

    // Views
    LogInModal = require('../../account/login/loginModal'),
    RegistrationModal = require('../../account/registration/registrationModal'),
    UploadForm = require('../../upload/uploadForm');

var TopbarView = Backbone.View.extend({
  
  signedInTemplate: App.Templates['partials/components/topbar/signedIn'],
  signedOutTemplate: App.Templates['partials/components/topbar/signedOut'],

  events: {
    'click .js-login': 'showLogInModal',
    'click .js-register': 'showRegisterModal',
    'click .js-logout': 'logout',
    'click .js-go-home': 'gotoHome',
    'click .js-go-products': 'gotoProducts',
    'click .js-go-about': 'gotoAbout',
    'click .js-go-cart': 'gotoCart',
    'click .js-go-orders': 'gotoOrders',
    'click .js-go-marketplace': 'gotoMarketplace'
  },

  initialize: function(opts) {
    this.router = opts.router;

    this.registrationModal = new RegistrationModal({ router: this.router });
    this.logInModal = new LogInModal({ router: this.router });

    this.setElement(Globals.TOPBAR_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();
  },

  bindEvents: function() {
    this.listenTo(App.events, 'session:signIn session:signOut', _.bind(this.render, this));
    this.listenTo(App.persist.get('cart'), 'add remove reset', _.bind(this.renderCartItemCount, this));
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    return this;
  },

  getContext: function() {
    var context = {};

    context.user = App.session.getSession().toJSON();
    if (App.session.isSignedIn()) context.cartCount = App.persist.get('cart').length || '';

    return context;
  },

  render: function() {
    if (App.session.isSignedIn()) {
      this.$('.topbar--session').html(this.signedInTemplate(this.getContext()));
    } else {
      this.$('.topbar--session').html(this.signedOutTemplate(this.getContext()));
    }
    return this;
  },

  renderCartItemCount: function() {
    var cart = App.persist.get('cart');
    this.$('.cart--item-count').html(cart.length || '');
  },

  gotoCart: function(e) {
    e.preventDefault();
    this.router.navigate('account/cart', { trigger: true, replace: false });
  },

  gotoOrders: function(e) {
    e.preventDefault();
    this.router.navigate('account/orders', { trigger: true, replace: false });
  },

  gotoHome: function(e) {
    e.preventDefault();
    this.router.navigate('/', { trigger: true, replace: false });
  },

  gotoAbout: function(e) {
    e.preventDefault();
    this.router.navigate('about', { trigger: true, replace: false });
  },

  gotoProducts: function(e) {
    e.preventDefault();
    this.router.navigate('products', { trigger: true, replace: false });
  },

  gotoMarketplace: function(e) {
    e.preventDefault();
    this.router.navigate('marketplace', { trigger: true, replace: false });
  },

  showLogInModal: function() {
    App.events.trigger('showLogInModal');
  },

  showRegisterModal: function() {
    App.events.trigger('showRegisterModal');
    analytics.track('Showed Registration Modal', {
      'Prompt': 'Top Bar CTA'
    });
  },

  logout: function() {
    App.session.signOut();
    App.analytics.trackSignOut();
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = TopbarView;