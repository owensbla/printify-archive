var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App,
    Helpers = require('../../../helpers'),

    // Collections
    Addresses = require('../../../collections/addresses'),

    // Models
    Order = require('../../../models/order'),

    // Views
    AddressForm = require('../../forms/address'),
    CreditCardForm = require('../../forms/creditCard'),
    PromoCodeForm = require('../../forms/promoCode');

var CheckoutView = Backbone.View.extend({
  
  template: App.Templates['layouts/account/checkout'],
  shippingOptionsTemplate: App.Templates['partials/account/checkout/shippingOptions'],

  stepTemplates: {
    shipping: App.Templates['partials/account/checkout/shipping'],
    billing: App.Templates['partials/account/checkout/billing'],
    confirm: App.Templates['partials/account/checkout/confirm']
  },

  TAXES: {
    CA: 7.5,
    IL: 7.75,
  },

  steps: ['shipping', 'billing', 'confirm'],

  events: {
    'click .js-calculate-shipping:not(.disabled)': 'onSubmitShipping',
    'click .js-shipping-method': 'onSelectShipping',
    'click .js-go-billing': 'gotoBillingStep',
    'click .js-submit-billing:not(.disabled)': 'onSubmitBilling',
    'click .js-checkout:not(.disabled)': 'onCheckout',
    'change .js-saved-addresses': 'onChangeAddress'
  },

  initialize: function(opts) {
    var _this = this,
        req;

    this.router = opts.router;
    this.collection = App.persist.get('cart');
    this.currentStep = 'shipping';
    this.shippingCost = 0.0;
    this.taxes = 0.0;

    this.addresses = new Addresses();

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    req = this.addresses.fetch();
    req.always(function() { _this.trigger('ready'); });
  },

  onReady: function() {
    if (App.state.get('initialLoad')) {
      this.renderStep().bindEvents().renderTotals();
      App.state.set('loading', false);
      this.checkCart();
      this.$('.js-field').first().focus();
      return;
    }

    this.render().renderStep().bindEvents().renderTotals();

    App.state.set('loading', false);

    this.$('.js-field').first().focus();

    this.checkCart();
  },

  bindEvents: function() {
    if (_.isUndefined(this.promoCodeForm)) this.promoCodeForm = new PromoCodeForm({ el: this.$('.js-promo-form') });

    this.listenTo(App.events, 'promoCodeForm:onSuccess', _.bind(this.onPromoApplied, this));
    this.listenTo(App.events, 'promoCodeForm:onError', _.bind(this.onPromoError, this));

    return this;
  },

  unbindEvents: function() {
    if (!_.isUndefined(this.promoCodeForm)) { this.promoCodeForm.close(); delete this.promoCodeForm; }
    this.stopListening();
    return this;
  },

  getContext: function() {
    var context = {};

    context.shippingAddresses = _.filter(this.addresses.toJSON(), function(a) { return a.addressType === 'shipping'; });
    context.billingAddresses = _.filter(this.addresses.toJSON(), function(a) { return a.addressType === 'billing'; });
    context.cartItems = this.collection.toJSON();
    context.formattedSubtotal = this.collection.getFormattedSubtotal();
    context.billingAddress = !_.isUndefined(this.billingAddress) ? this.billingAddress.toJSON() : false;
    context.shippingAddress = !_.isUndefined(this.shippingAddress) ? this.shippingAddress.toJSON() : false;
    context.creditCard = !_.isUndefined(this.creditCard) ? this.creditCard.toJSON() : false;

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  renderStep: function(step) {
    var currentAddress;

    this.$('.js-body').html(this.stepTemplates[this.currentStep](this.getContext()));
    
    switch (this.currentStep) {
      case 'shipping':
        this.shippingAddressForm = new AddressForm({ el: this.$('.js-form'), addressType: 'shipping' });
        if (this.$('.js-saved-addresses').length) {
          currentAddress = this.$('.js-saved-addresses').val();
          this.shippingAddressForm.setAddress(this.addresses.get(currentAddress));
        }
        break;
      case 'billing':
        this.$('.hero--step[data-step="1"]').addClass('is-complete').removeClass('is-active');
        this.$('.hero--step[data-step="2"]').addClass('is-active');
        this.creditCardForm = new CreditCardForm({ el: this.$('.js-cc-form') });
        this.billingAddressForm = new AddressForm({ el: this.$('.js-form'), addressType: 'billing' });
        if (this.$('.js-saved-addresses').length) {
          currentAddress = this.$('.js-saved-addresses').val();
          this.billingAddressForm.setAddress(this.addresses.get(currentAddress));
        }
        break;
      case 'confirm':
        this.$('.hero--step[data-step="2"]').addClass('is-complete').removeClass('is-active');
        this.$('.hero--step[data-step="3"]').addClass('is-active');
        break;
    }

    this.$('.js-field').first().focus();
    $(window).scrollTop(0);

    return this;
  },

  renderTotals: function() {
    var subtotal = this.collection.getSubtotal(),
        discount = _.isUndefined(this.collection.discount) ? 0 : this.collection.discount,
        taxes = this.taxes,
        shippingCost = this.shippingCost,
        total = parseFloat((subtotal - discount) + taxes + shippingCost);

    this.$('.js-checkout-total[data-field="total"]').text('$' + total.toFixed(2));
    this.$('.js-checkout-total[data-field="shipping"]').text('$' + shippingCost.toFixed(2));
    this.$('.js-checkout-total[data-field="tax"]').text('$' + taxes.toFixed(2));

    return this;
  },

  renderShipping: function(shippingOptions) {
    this.$('.js-shipping-message').remove();
    this.$('.js-shipping').html(this.shippingOptionsTemplate(shippingOptions));

    return this;
  },

  gotoBillingStep: function() {
    var _this = this;  

    // if (this.shippingMethod.id !== 'FEDEX_STANDARD_OVERNIGHT') {
    //   swal({
    //     title: 'Hold On!',
    //     text: 'Are you shipping for the holidays? Select FedEx Overnight to ensure delivery!',
    //     type: 'warning',
    //     showCancelButton: true,
    //     confirmButtonText: 'Okay, let me change!',
    //     cancelButtonText: 'No thanks.'
    //   }, function(isConfirm) {
    //     if (!isConfirm) {
    //       _this.currentStep = 'billing';
    //       _this.renderStep();

    //       analytics.track('Completed Checkout Shipping Step');
    //     }
    //   });
    // } else {
      this.currentStep = 'billing';
      this.renderStep();

      analytics.track('Completed Checkout Shipping Step');
    // }
  },

  gotoConfirmStep: function() {
    this.currentStep = 'confirm';
    this.renderStep();

    analytics.track('Completed Checkout Billing Step');
  },

  gotoNextStep: function() {
    this.currentStep = this.steps[_.indexOf(this.steps, this.currentStep) + 1];
    this.renderStep();
  },

  onCheckout: function() {
    var _this = this,
        promoCode = this.$('.js-field[data-field="promoCode"]').val() || false,
        req;

    Helpers.UI.addSpinner(this.$('.js-checkout'));

    req = this.collection.checkout({
      shippingFirstName: this.shippingAddress.get('firstName'),
      shippingLastName: this.shippingAddress.get('lastName'),
      shippingMethod: this.shippingMethod.id,
      shippingAddress1: this.shippingAddress.get('address1'),
      shippingAddress2: this.shippingAddress.get('address2'),
      shippingCity: this.shippingAddress.get('city'),
      shippingState: this.shippingAddress.get('state'),
      shippingZipCode: this.shippingAddress.get('zipCode'),
      shippingCountry: this.shippingAddress.get('country'),
      billingFirstName: this.billingAddress.get('firstName'),
      billingLastName: this.billingAddress.get('lastName'),
      billingAddress1: this.billingAddress.get('address1'),
      billingAddress2: this.billingAddress.get('address2'),
      billingCity: this.billingAddress.get('city'),
      billingState: this.billingAddress.get('state'),
      billingZipCode: this.billingAddress.get('zipCode'),
      billingCountry: this.shippingAddress.get('country'),
      creditCard: this.creditCard.get('id'),
      promoCode: promoCode
    });

    req.done(_.bind(this.onCheckoutSuccess, this));
    req.fail(_.bind(this.onCheckoutError, this));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-checkout')); });
  },

  onCheckoutSuccess: function(resp) {
    swal({
      title: 'Awesome!',
      text: 'Order complete! Your order is now being processed and prepared for printing and shipping. ' +
            'You can check on the order status at any time by going to your "Order History".',
      type: 'success',
      confirmButtonText: 'Got It!'
    });

    analytics.track('Completed Order', {
      'Discount': resp.discount,
      'Discount Type': resp.discountType,
      'ID': resp.id,
      'Item Count': resp.orderItems.length,
      'Shipping Method': resp.shippingMethod,
      'Subtotal': resp.subtotal,
      'Total': resp.total
    });

    App.analytics.trackCheckout();

    this.collection.reset();

    this.router.navigate('account/orders/' + resp.id, { trigger: true, replace: false });
  },

  onCheckoutError: function(resp) {
    swal({
      title: 'Oops!',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error',
      confirmButtonText: 'Okay'
    });
  },

  onSubmitBilling: function() {
    var _this = this,
        isValid = true,
        req;

    if (!this.billingAddressForm.validateForm()) isValid = false;
    if (!this.creditCardForm.validateForm()) isValid = false;
    if (!isValid) {
      this.$('.has-error').first().focus();
      return;
    }

    Helpers.UI.addSpinner(this.$('.js-submit-billing'));

    req = this.billingAddressForm.submitForm();
    req.done(_.bind(this.saveCreditCard, this));
    req.fail(function() { Helpers.UI.removeSpinner(_this.$('.js-submit-billing')); });
  },

  saveCreditCard: function() {
    var _this = this;

    // make sure we're still spinnin'
    Helpers.UI.addSpinner(this.$('.js-submit-billing'));
    
    this.billingAddress = this.billingAddressForm.model;
    this.creditCardForm.submitForm(this.billingAddress, function(req) {
      req.done(_.bind(_this.onCreditCardSuccess, _this));
      req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-submit-billing')); });
    });
  },

  onCreditCardSuccess: function() {
    this.creditCard = this.creditCardForm.model;
    this.gotoConfirmStep();
  },

  onPromoApplied: function(resp) {
    var difference = parseFloat(this.collection.getSubtotal() - resp.discountedSubtotal);

    this.collection.discount = difference;

    this.$('.js-discount').addClass('is-applied');
    this.$('.js-checkout-total[data-field="discount"]').text('-$' + difference.toFixed(2));

    this.renderTotals();
  },

  onPromoError: function() {
    // reset the discount
    this.collection.discount = 0;

    this.$('.js-discount').removeClass('is-applied');
    this.$('.js-field[data-field="promoCode"]').val('');

    this.renderTotals();
  },

  checkCart: function() {
    if (!this.collection.length) {
      swal({
        title: 'Cart Empty',
        text: 'Your cart is empty. Add some prints and come back to checkout!',
        type: 'info',
        confirmButtonText: 'Okay'
      });
      
      this.router.navigate('products', { trigger: true, replace: true });
    }
  },

  onSubmitShipping: function() {
    var _this = this,
        req;

    if (!this.shippingAddressForm.validateForm()) return;

    Helpers.UI.addSpinner(this.$('.js-calculate-shipping'));

    req = this.shippingAddressForm.submitForm();
    req.done(_.bind(this.calculateShipping, this));
    req.fail(function() { Helpers.UI.removeSpinner(_this.$('.js-calculate-shipping')); });
  },

  calculateTaxes: function() {
    var shippingState = this.shippingAddressForm.serializeForm().state.toUpperCase();

    if (_.has(this.TAXES, shippingState)) {
      this.taxes = parseFloat(parseFloat(this.collection.getSubtotal() * (this.TAXES[shippingState] / 100)).toFixed(2));
    } else {
      this.taxes = 0.0;
    }
  },

  calculateShipping: function() {
    this.shippingAddress = this.shippingAddressForm.model;

    var _this = this,
        shippingAddress = this.shippingAddress,
        state = shippingAddress.get('state'),
        country = shippingAddress.get('country'),
        zipCode = shippingAddress.get('zipCode'),
        shippingParams = {
          state: state,
          country: country,
          zipCode: zipCode
        },
        req;

    Helpers.UI.addSpinner(this.$('.js-calculate-shipping'));

    req = this.collection.getShippingRates(shippingParams);

    req.done(_.bind(this.onSubmitShippingSuccess, this));
    req.fail(_.bind(this.onSubmitShippingError, this));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-calculate-shipping')); });
  },

  onSubmitShippingSuccess: function(resp) {
    this.calculateTaxes();
    this.shippingMethods = resp;
    this.renderShipping({ shippingMethods: resp });

    var defaultMethodId = this.$('.js-shipping-method.is-selected').attr('data-id'),
        defaultMethod = _.find(this.shippingMethods, function(method) { return method.id === defaultMethodId; }),
        shippingRate = defaultMethod.rate;

    analytics.track('Calculated Shipping');

    this.shippingMethod = defaultMethod;
    this.shippingCost = parseFloat(shippingRate);
    this.renderTotals();
  },

  onSubmitShippingError: function(resp) {
    swal({
      title: 'Error Calculating Shipping',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error',
      confirmButtonText: 'Okay'
    });
  },

  onSelectShipping: function(e) {
    var $el = $(e.currentTarget),
        methodId = $el.attr('data-id'),
        shippingMethod = _.find(this.shippingMethods, function(method) { return method.id === methodId; });

    if ($el.hasClass('is-selected')) return;

    this.$('.js-shipping-method').removeClass('is-selected');
    $el.addClass('is-selected');

    this.shippingMethod = shippingMethod;
    this.shippingCost = parseFloat(shippingMethod.rate);
    this.renderTotals();
  },

  onChangeAddress: function(e) {
    var $el = $(e.currentTarget),
        addressType = $el.attr('data-address-type'),
        addressId = $el.val(),
        address = this.addresses.get(addressId);

    if (addressType === 'shipping') {
      if (addressId === 'new') {
        this.shippingAddressForm.resetForm();
      } else {
        this.shippingAddressForm.setAddress(address); 
      }
    } else {
      if (addressId === 'new') {
        this.billingAddressForm.resetForm();
      } else {
        this.billingAddressForm.setAddress(address);
      }
    }
  },

  onClose: function() {
    this.collection.discount = 0;
    if (!_.isUndefined(this.shippingAddressForm)) this.shippingAddressForm.close();
    if (!_.isUndefined(this.billingAddressForm)) this.billingAddressForm.close();
    if (!_.isUndefined(this.promoCodeForm)) this.promoCodeForm.close();
    this.unbindEvents();
  }

});

module.exports = CheckoutView;