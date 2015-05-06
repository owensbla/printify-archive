var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App,

    // Views
    LogInForm = require('./loginForm');

var LogInModal = Backbone.View.extend({
  
  template: App.Templates['partials/account/login/modal'],

  events: {
    'click .js-show-create-account': 'showCreateAccountModal'
  },

  initialize: function(opts) {
    this.router = opts.router;

    this.modal = new App.Modal({
      className: 'login-modal'
    });

    this.setElement(this.modal.$el);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();

    this.logInForm = new LogInForm({
      el: this.$('.js-form'),
      router: this.router
    });
  },

  bindEvents: function() {
    this.listenTo(App.events, 'showLogInModal', _.bind(this.showModal, this));
    this.listenTo(App.events, 'logInForm:onSuccess', _.bind(this.hideModal, this));
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
    this.modal.setContent(this.template(this.getContext()));
    return this;
  },

  showCreateAccountModal: function() {
    this.hideModal();
    _.delay(function() { App.events.trigger('showRegisterModal'); }, 300);
  },

  showModal: function() {
    var _this = this;

    this.modal.showModal();
    App.events.trigger('logInModal:showModal');
    analytics.track('Open Log In Modal');

    _.delay(function() {
      _this.logInForm.$('.js-field').floatlabel();
      _this.logInForm.$('.js-field').first().focus();
    }, 200);
  },

  hideModal: function() {
    this.modal.hideModal();
    App.events.trigger('logInModal:hideModal');
    this.logInForm.resetForm();
  },

  onClose: function() {
    this.modal.close();
    this.unbindEvents();
  }

});

module.exports = LogInModal;