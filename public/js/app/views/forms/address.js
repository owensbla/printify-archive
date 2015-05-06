var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    Helpers = require('../../helpers'),
    App = Globals.App,

    COUNTRIES = require('./countries.json'),

    // Models
    Address = require('../../models/address');

var AddressForm = Backbone.FormView.extend({
  
  template: App.Templates['partials/forms/addressForm'],

  fields: {
    'firstName': {
      validators: ['requiredValidator']
    },
    'lastName': {
      validators: ['requiredValidator']
    },
    'address1': {
      validators: ['requiredValidator']
    },
    'address2': {
      validators: []
    },
    'city': {
      validators: ['requiredValidator']
    },
    'state': {
      validators: ['requiredValidator']
    },
    'zipCode': {
      validators: ['requiredValidator']
    },
    'country': {
      validators: ['requiredValidator']
    }
  },

  saveSelector: '.js-save:not(.disabled)',

  events: {
    'change .js-field[data-field="country"]': 'onCountrySelection',
    'change .js-field[data-field="state"]': 'onStateSelection',
    'keyup .js-field.has-error': 'clearError',
    'submit .js-address-form': 'onSubmit'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.model = new Address({ addressType: opts.addressType });

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();
    this.$('.js-field').floatlabel();
  },

  bindEvents: function() {
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    return this;
  },

  getContext: function() {
    var context = {},
        countries = _.reject(COUNTRIES, function(country) { return country.code === 'US'; });

    context.countries = _.sortBy(countries, function(c) { return c.name; });

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  renderAddress: function() {
    var _this = this,
        selectedCountry, states;

    _.each(_.keys(this.fields), function(field) {
      _this.$('.js-field[data-field="' + field + '"]').val(_this.model.get(field));
    });

    selectedCountry = this.$('.js-field[data-field="country"]').val();

    if (selectedCountry === '-1') {
      this.$('.js-field[data-field="state"]').parents('.form--field').hide();
      return;
    }

    states = _.find(COUNTRIES, function(c) { return c.code === selectedCountry; }).states;

    if (states) {
      this.renderStates(states);
      this.$('.js-field[data-field="state"]').val(this.model.get('state')).parents('.form--field').show();
    }
  },

  renderStates: function(states) {
    var _this = this;

    this.$('.js-field[data-field="state"]').html('');

    _.each(states, function(state) {
      _this.$('.js-field[data-field="state"]').append($('<option />').attr('value', state.code).text(state.name));
    });
  },

  setAddress: function(address) {
    this.model.set(address.attributes);
    this.renderAddress();
  },

  stateValidator: function() {
    var $messageField = this.$('.js-field-message[data-field="state"]'),
        $field = this.$('.js-field[data-field="state"]'),
        isValid = true,
        _this = this;

    if (!_.contains(this.stateCodes, $field.val().toUpperCase())) {
      $field.addClass('has-error');
      this.setMessage({
        message: 'Invalid state code.',
        className: 'message--error',
        $el: $messageField
      });
      isValid = false;
    } else {
      $field.removeClass('has-error');
      this.clearMessage($messageField);
    }

    return isValid;
  },

  submitForm: function() {
    var _this = this,
        address = this.serializeForm(),
        req;

    req = this.model.save(address);
    req.done(_.bind(this.onSuccess, this));
    req.fail(_.bind(this.onError, this));

    Helpers.UI.addSpinner(this.$('.js-save'));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-save')); });

    return req;
  },

  onSubmit: function() {
    if (this.$('.js-save').hasClass('disabled')) return;
    this.validateAndSubmitForm();
  },

  onSuccess: function() {
    App.events.trigger('addressForm:onSuccess', this.model);
    this.trigger('addressForm:onSuccess', this.model);
  },

  onError: function(resp) {
    App.events.trigger('addressForm:onError');

    this.setMessage({
      className: 'message--error',
      message: Helpers.Forms.parseErrorResponse(resp)
    });
  },

  onCountrySelection: function(e) {
    var $el = $(e.currentTarget),
        selectedCountry = $el.val(),
        states;

    if (selectedCountry === '-1') {
      this.$('.js-field[data-field="state"]').parents('.form--field').hide();
      return;
    }

   states = _.find(COUNTRIES, function(c) { return c.code === selectedCountry; }).states;

    if (states) {
      // render states
      this.renderStates(states);
      this.$('.js-field[data-field="state"]').parents('.form--field').show();
    } else {
      this.$('.js-field[data-field="state"]').parents('.form--field').hide();
    }
  },

  onStateSelection: function() {},

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = AddressForm;