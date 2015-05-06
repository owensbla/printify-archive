var _ = require('lodash'),
    Backbone = require('backbone'),
    Helpers = require('../helpers'),
    Globals = require('../globals'),
    App = Globals.App,

    // Models
    Cart = require('../collections/cart'),
    User = require('../models/user');

var SessionController = Backbone.View.extend({

  initialize: function() {
    var _this = this,
        req;

    App.persist.set('utm_source', Helpers.getParameterByName('utm_source') || 'Direct');
    App.persist.set('utm_medium', Helpers.getParameterByName('utm_medium') || false);
    App.persist.set('utm_term', Helpers.getParameterByName('utm_term') || false);
    App.persist.set('utm_content', Helpers.getParameterByName('utm_content') || false);
    App.persist.set('utm_campaign', Helpers.getParameterByName('utm_campaign') || false);
    App.persist.set('cart', new Cart());

    this.state = new (Backbone.Model.extend({}))();
    this.model = new User();
  },

  initialFetch: function() {
    var _this = this,
        req;

    req = this.model.fetch();

    req.done(_.bind(this.onReady, this));
    req.fail(function(resp) {
      if (resp.status === 401) {
        _this.onReady();
      } else {
        // throw 500
      }
    });

    return req;
  },

  onReady: function() {
    var _this = this,
        req;

    this.bindEvents();

    if (this.model.get('isActive')) {
      _this.onSignIn();
      this.state.set('signedIn', true);
    } else {
      _this.onSignOut();
      this.state.set('signedIn', false);
    }

    this.render();

    App.events.trigger('session:ready');
  },

  bindEvents: function() {
    var _this = this;

    this.listenTo(App.events, 'session:fetch', _.bind(this.fetchSession, this));
    this.listenTo(this.model, 'change:isActive', function() {
      if (_this.model.get('isActive')) {
        _this.onSignIn();
        _this.state.set('signedIn', true);
        App.events.trigger('session:signIn', this.getSession());
      } else {
        _this.onSignOut();
        _this.state.set('signedIn', false);
        App.events.trigger('session:signOut');
      }
    });
  },

  unbindEvents: function() {
    this.stopListening();
  },

  signOut: function() {
    return this.getSession().signOut();
  },

  onSignIn: function() {
    App.braintree = new App.Braintree.api.Client({
      clientToken: this.model.get('braintreeClientToken')
    });
    // App.Bugsnag.user = {
    //   id: this.model.get('id'),
    //   name: this.model.get('fullName'),
    //   email: this.model.get('email')
    // };
    App.persist.get('cart').add((new Cart(this.model.get('cartItems'))).models);
  },

  onSignOut: function() {
    App.persist.get('cart').reset();
    delete App.braintree;
    // App.Bugsnag.user = {};
    App.cache.clear();
  },

  isSignedIn: function() {
    return this.state.get('signedIn');
  },

  getSession: function() {
    return this.model;
  },

  fetchSession: function() {
    var req = this.model.fetch({}),
        _this = this;

    req.done(function() {});
    req.fail(function() {});
    
    return req;
  },

  onClose: function() {

  }

});

module.exports = SessionController;