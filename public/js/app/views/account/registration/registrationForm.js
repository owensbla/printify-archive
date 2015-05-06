var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    Helpers = require('../../../helpers'),
    App = Globals.App;

var RegistrationForm = Backbone.FormView.extend({
  
  template: App.Templates['partials/account/registration/form'],

  fields: {
    'firstName': {
      validators: ['requiredValidator']
    },
    'lastName': {
      validators: ['requiredValidator']
    },
    'email': {
      validators: ['requiredValidator', 'emailValidator']
    },
    'password': {
      validators: ['requiredValidator', 'passwordValidator']
    }
  },

  saveSelector: '.js-register:not(.disabled)',

  events: {
    'keyup .js-field.has-error': 'clearError',
    'submit .js-register-form': 'onSubmit'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.model = App.session.getSession();

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();
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

  emailValidator: function() {
    var email = this.serializeForm().email,
        isValid = this.model.validateEmail(email);

    if (isValid !== true) {
      this.$('.js-field[data-field="email"]').addClass('has-error');
      this.setMessage({
        message: isValid,
        className: 'message--error',
        $el: this.$('.js-field-message[data-field="email"]')
      });
    }

    return isValid === true;
  },

  passwordValidator: function() {
    var password = this.serializeForm().password,
        isValid = this.model.validatePassword(password);

    if (isValid !== true) {
      this.$('.js-field[data-field="password"]').addClass('has-error');
      this.setMessage({
        message: isValid,
        className: 'message--error',
        $el: this.$('.js-field-message[data-field="password"]')
      });
    }

    return isValid === true;
  },

  onSubmit: function() {
    if (this.$('.js-register').hasClass('disabled')) return;
    this.validateAndSubmitForm();
  },

  submitForm: function() {
    var _this = this,
        userData = this.serializeForm(),
        req;

    userData.confirmedTerms = true;
    userData.newsletterOptIn = this.$('.js-field[data-field="newsletterOptIn"]:checked').length === 1;

    req = this.model.register(userData);
    req.done(_.bind(this.onSuccess, this));
    req.fail(_.bind(this.onError, this));

    Helpers.UI.addSpinner(this.$('.js-register'));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-register')); });

    return req;
  },

  onSuccess: function() {
    this.resetForm();
    App.events.trigger('registrationForm:onSuccess');
    App.analytics.trackRegistration();

    swal({
      type: 'success',
      title: 'Welcome to Printify.io',
      text: 'Make sure you check your email for a special gift!',
      confirmButtonText: 'Okay',
      confirmButtonColor: '#7ec9cb'
    });
  },

  onError: function(resp) {
    App.events.trigger('registrationForm:onError');
    
    this.setMessage({
      className: 'message--error',
      message: Helpers.Forms.parseErrorResponse(resp)
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = RegistrationForm;