var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    Helpers = require('../../helpers'),
    App = Globals.App,

    // Models
    CartItem = require('../../models/cartItem'),
    Photo = require('../../models/photo');

var MarketplaceView = Backbone.View.extend({
  
  template: App.Templates['layouts/pages/marketplaceProduct'],

  events: {
    'click .js-select-size': 'selectSize',
    'click .js-add-to-cart': 'onAddToCart'
  },

  initialize: function(opts) {
    this.router = opts.router;

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    if (App.state.get('initialLoad')) { this.bindEvents(); this.setInitialSize(); App.state.set('loading', false); return; }

    this.render().bindEvents();
    this.setInitialSize();

    App.state.set('loading', false);
  },

  bindEvents: function() {
    Helpers.UI.loadTabs(this.$el);
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    return this;
  },

  getContext: function() {
    var context = {};

    context.marketplaceProduct = this.model.toJSON();
    context.posters = this.model.getPosters();
    context.framedPosters = this.model.getFramedPosters();

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  setInitialSize: function() {
    var variation;

    variation = _.first(this.model.getFramedPosters());
    if (!variation) variation = _.first(this.model.getPosters());

    this.$('.product--size[data-product="' + variation.product.id + '"]').addClass('is-selected');
  },

  selectSize: function(e) {
    var $target = $(e.currentTarget),
        $previous = this.$('.product--size.is-selected');

    $previous.removeClass('is-selected');
    $target.addClass('is-selected');
  },

  getSelectedVariation: function() {
    var variationId = parseInt(this.$('.product--size.is-selected').attr('data-id'));
    return _.find(this.model.get('variations'), function(v) { return v.id === variationId; });
  },

  promptToRegister: function() {
    // if they aren't signed in, prompt them to register now and prevent default
    swal({
      title: 'Create an Account',
      text: 'You\'re almost there! Create an account now and you\'ll get 5% off your first purchase!',
      type: 'info',
      confirmButtonText: 'Okay'
    }, function() {
      App.events.trigger('showRegisterModal');
    });
  },

  onAddToCart: function() {
    var _this = this,
        req;

    // if they're signed in, don't do anything
    if (!App.session.isSignedIn()) return this.promptToRegister();

    // create cart item using the cropped photo
    this.cartItem = new CartItem({ photo: this.getSelectedVariation().photo.id, product: this.getSelectedVariation().product.id });

    Helpers.UI.addSpinner(this.$('.js-add-to-cart'));

    req = this.cartItem.save();

    req.done(_.bind(this.onCartSuccess, this));
    req.fail(_.bind(this.onCartError, this));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-add-to-cart')); });
  },

  onCartSuccess: function() {
    var _this = this;

    App.persist.get('cart').add(this.cartItem);

    swal({
      title: 'Added to Cart',
      text: 'Awesome! The print has been added to your cart.',
      type: 'success',
      confirmButtonText: 'Got It!'
    }, function() {
      _this.router.navigate('account/cart', { trigger: true, replace: false });
    });

    analytics.track('Print Added To Cart', {
      'Product Model': this.model.get('model'),
      'Product Name': this.model.get('name'),
      'Product Size': this.model.get('size'),
      'Product Price': this.model.get('price')
    });
  },

  onCartError: function(resp) {
    swal({
      title: 'Cart Error',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error',
      confirmButtonText: 'Okay'
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = MarketplaceView;