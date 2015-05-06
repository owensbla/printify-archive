var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App;

var CartView = Backbone.View.extend({
  
  template: App.Templates['layouts/account/cart'],

  events: {
    'click .js-go-checkout': 'gotoCheckout',
    'click .js-remove': 'onRemoveCartItem'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.collection = App.persist.get('cart');
    this.currentStep = 'cart';

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    if (App.state.get('initialLoad')) { this.bindEvents(); App.state.set('loading', false); return; }

    this.render().bindEvents();

    App.state.set('loading', false);
  },

  bindEvents: function() {
    this.listenTo(this.collection, 'add remove', _.bind(this.render, this));
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    return this;
  },

  getContext: function() {
    var context = {};

    context.cartItems = this.collection.toJSON();
    context.formattedSubtotal = this.collection.getFormattedSubtotal();

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  gotoCheckout: function(e) {
    if (!this.collection.length) {
      swal({
        title: 'Cart Empty',
        text: 'Your cart is empty. Add some prints and come back to checkout!',
        type: 'info',
        confirmButtonText: 'Okay'
      });

      this.router.navigate('products', { trigger: true, replace: true });
      
      return;
    }

    e.preventDefault();
    this.router.navigate('account/checkout', { trigger: true, replace: false });
  },

  onRemoveCartItem: function(e) {
    var $el = $(e.currentTarget),
        cartItemId = $el.attr('data-id'),
        cartItem = this.collection.get(cartItemId),
        _this = this;

    swal({
      title: 'Remove From Cart',
      text: 'Are you sure you want to remove the ' + cartItem.get('product').size + ' ' + cartItem.get('product').formattedModel + ' from your cart?',
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it.',
      cancelButtonText: 'No'
    }, function(isConfirm) {
      if (!isConfirm) return;

      cartItem.destroy();
      _this.collection.remove(cartItem);
      $el.parent('.cart--print').remove();

      swal({
        title: cartItem.get('product').size + ' ' + cartItem.get('product').formattedModel + ' removed.',
        text: 'The print has been removed from your cart.',
        type: 'success'
      });
      $el.remove();
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = CartView;