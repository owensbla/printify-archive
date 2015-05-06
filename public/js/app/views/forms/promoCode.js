var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    Helpers = require('../../helpers'),
    App = Globals.App;

var PromoCodeForm = Backbone.FormView.extend({
  
  template: App.Templates['partials/forms/promoCodeForm'],

  fields: {
    'promoCode': {
      validators: ['requiredValidator']
    }
  },

  saveSelector: '.js-apply:not(.disabled)',

  events: {
    'click .js-apply:not(.disabled)': 'validateAndSubmitForm',
    'keyup .js-field.has-error': 'clearError',
    'submit .js-promo-form': 'onSubmit'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.collection = App.persist.get('cart');

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
    var context = {};
    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  submitForm: function() {
    var _this = this,
        promoCode = this.serializeForm(),
        req;

    req = this.collection.applyPromoCode(promoCode);
    req.done(_.bind(this.onSuccess, this));
    req.fail(_.bind(this.onError, this));

    Helpers.UI.addSpinner(this.$('.js-apply'));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-apply')); });

    return req;
  },

  onSubmit: function() {
    if (this.$('.js-apply').hasClass('disabled')) return;
    this.validateAndSubmitForm();
  },

  onSuccess: function(resp) {
    var discountNoun = resp.discountType === 'flat' ? 'dollars' : 'percent';

    App.events.trigger('promoCodeForm:onSuccess', resp);
    analytics.track('Promo Code Applied', {
      'Promo Code': this.serializeForm().promoCode,
      'Discount Value': resp.discount,
      'Discount Type': resp.discountType
    });

    swal({
      confirmButtonText: 'Awesome!',
      text: 'A discount of ' + resp.discount + ' ' + discountNoun + ' has been applied to your cart.',
      title: 'Success!',
      type: 'success',
      timer: 4000
    });
  },

  onError: function(resp) {
    App.events.trigger('promoCodeForm:onError');

    swal({
      confirmButtonText: 'Okay',
      title: 'Oops!',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error'
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = PromoCodeForm;