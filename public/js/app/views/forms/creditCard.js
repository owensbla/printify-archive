var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    Helpers = require('../../helpers'),
    App = Globals.App,

    CreditCard = require('../../models/creditCard');

var CreditCardForm = Backbone.FormView.extend({

  ACCEPTED_CARDS: ['visa', 'mastercard', 'discover', 'amex'],
  
  template: App.Templates['partials/forms/creditCardForm'],

  fields: {
    'cardNumber': {
      validators: ['requiredValidator', 'cardNumberValidator']
    },
    'expirationMonth': {
      validators: ['futureValidator']
    },
    'expirationYear': {
      validators: ['futureValidator']
    },
    'cvv': {
      validators: ['requiredValidator']
    },
  },

  events: {
    'keyup .js-field.has-error': 'clearError'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.collection = App.persist.get('cart');
    this.model = new CreditCard();

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();
    this.$('.js-field[data-field="cardNumber"]').payment('formatCardNumber');
    this.$('.js-field[data-field="cvv"]').payment('formatCardCVC');
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
    var now = new Date(),
        month = now.getMonth() + 1,
        year = now.getUTCFullYear() + '';

    month = month.length < 2 ? '0' + month : month + '';

    this.$el.html(this.template(this.getContext()));

    this.$('.js-field[data-field="expirationMonth"]').val(month);
    this.$('.js-field[data-field="expirationYear"]').val(year);

    return this;
  },

  cardNumberValidator: function() {
    var $messageField = this.$('.js-field-message[data-field="cardNumber"]'),
        $field = this.$('.js-field[data-field="cardNumber"]'),
        isValid = true,
        _this = this,
        cardNumber, cardType;

    cardNumber = $field.val();
    cardType = $.payment.cardType(cardNumber);

    if (!cardType || !_.contains(this.ACCEPTED_CARDS, cardType)) {
      $field.addClass('has-error');
      this.setMessage({
        message: 'Sorry, we only accept Visa, Mastercard, American Express, and Discover cards.',
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

  futureValidator: function() {
    var $messageField = this.$('.js-field-message[data-field="expirationMonth"]'),
        $month = this.$('.js-field[data-field="expirationMonth"]'),
        $year = this.$('.js-field[data-field="expirationYear"]'),
        isValid = true,
        _this = this,
        currentMonth = parseInt((new Date()).getMonth()),
        expirationMonth = parseInt($month.val()),
        currentYear = parseInt((new Date()).getUTCFullYear()),
        expirationYear = parseInt($year.val());

    if ((expirationMonth < currentMonth && currentYear === expirationYear) || expirationYear < currentYear) {
      $month.addClass('has-error');
      $year.addClass('has-error');
      this.setMessage({
        message: 'Oops, it looks like this card is expired!',
        className: 'message--error',
        $el: $messageField
      });
      isValid = false;
    } else {
      $month.removeClass('has-error');
      $year.removeClass('has-error');
      this.clearMessage($messageField);
    }

    return isValid;
  },

  serializeCreditCard: function() {
    var $field = this.$('.js-field[data-field="cardNumber"]'),
        cardNumber = $field.val();
    cardNumber = cardNumber.replace(/ /g, '');
    return cardNumber;
  },

  submitForm: function(billingAddress, done) {
    var _this = this,
        creditCard = this.serializeForm(),
        req;

    App.braintree.tokenizeCard({
      number: creditCard.cardNumber,
      cardholderName: billingAddress.getFullName(),
      expirationMonth: creditCard.expirationMonth,
      expirationYear: creditCard.expirationYear,
      cvv: creditCard.cvv,
      billingAddress: {
        postalCode: billingAddress.get('zipCode')
      }
    }, function(err, nonce) {
      if (err) _this.onError();
      done(_this.onTokenized(nonce, billingAddress));
    });
  },

  onTokenized: function(nonce, billingAddress) {
    var _this = this,
        creditCard = {
          billingAddress: billingAddress.get('id'),
          nonce: nonce
        },
        req;

    req = this.model.save(creditCard);
    req.done(_.bind(this.onSuccess, this));
    req.fail(_.bind(this.onError, this));

    return req;
  },

  onSubmit: function() {
    this.validateAndSubmitForm();
  },

  onSuccess: function(resp) {
    App.events.trigger('creditCardForm:onSuccess', resp);
  },

  onError: function(resp) {
    App.events.trigger('creditCardForm:onError');

    swal({
      confirmButtonText: 'Okay',
      title: 'Oops!',
      text: 'We had some trouble processing your request. If this problem persists, please contact support@printify.io.',
      type: 'error'
    });

    // App.Bugsnag.notify('Braintree Error', 'Failed to tokenize card.');
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = CreditCardForm;