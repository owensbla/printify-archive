var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    Helpers = require('../../../helpers'),
    App = Globals.App;

var LogInForm = Backbone.FormView.extend({
  
  template: App.Templates['partials/account/login/form'],

  fields: {
    'email': {
      validators: ['requiredValidator', 'emailValidator']
    },
    'password': {
      validators: ['requiredValidator', 'passwordValidator']
    }
  },

  saveSelector: '.js-login:not(.disabled)',

  events: {
    'keyup .js-field.has-error': 'clearError',
    'submit .js-login-form': 'onSubmit'
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

  submitForm: function() {
    var _this = this,
        userData = this.serializeForm(),
        req;

    req = this.model.signIn(userData);
    req.done(_.bind(this.onSuccess, this));
    req.fail(_.bind(this.onError, this));

    Helpers.UI.addSpinner(this.$('.js-login'));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-login')); });

    return req;
  },

  onSubmit: function() {
    if (this.$('.js-login').hasClass('disabled')) return;
    this.validateAndSubmitForm();
  },

  onSuccess: function() {
    this.resetForm();
    App.events.trigger('logInForm:onSuccess');
    App.analytics.trackSignIn();

    // swal({
    //   confirmButtonText: 'Thanks!',
    //   title: 'Welcome back, ' + App.session.getSession().get('firstName') + '!',
    //   type: 'success',
    //   timer: 3000
    // });
  },

  onError: function(resp) {
    App.events.trigger('logInForm:onError');

    this.setMessage({
      className: 'message--error',
      message: Helpers.Forms.parseErrorResponse(resp)
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = LogInForm;