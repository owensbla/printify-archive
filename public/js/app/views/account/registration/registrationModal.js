var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App,

    // Views
    RegistrationForm = require('./registrationForm');

var RegistrationModal = Backbone.View.extend({
  
  template: App.Templates['partials/account/registration/modal'],

  events: {
    'click .js-show-login': 'showLogInModal'
  },

  initialize: function(opts) {
    this.router = opts.router;
    
    this.modal = new App.Modal({
      className: 'register-modal'
    });

    this.setElement(this.modal.$el);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();

    this.registrationForm = new RegistrationForm({
      el: this.$('.js-form'),
      router: this.router
    });
  },

  bindEvents: function() {
    this.listenTo(App.events, 'showRegisterModal', _.bind(this.showModal, this));
    this.listenTo(App.events, 'registrationForm:onSuccess', _.bind(this.hideModal, this));
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

  showLogInModal: function() {
    this.hideModal();
    _.delay(function() { App.events.trigger('showLogInModal'); }, 300);
  },

  showModal: function() {
    var _this = this;

    this.modal.showModal();
    App.events.trigger('registrationModal:showModal');
    analytics.track('Open Create Account Modal');

    _.delay(function() {
      _this.registrationForm.$('.js-field').floatlabel();
      _this.registrationForm.$('.js-field').first().focus();
    }, 200);
  },

  hideModal: function() {
    this.modal.hideModal();
    App.events.trigger('registrationModal:hideModal');
    this.registrationForm.resetForm();
  },

  onClose: function() {
    this.modal.close();
    this.unbindEvents();
  }

});

module.exports = RegistrationModal;