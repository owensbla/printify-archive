var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App,
    Helpers = require('../../helpers'),

    Products = require('../../collections/products');

var ProductView = Backbone.View.extend({

  canvasTemplate: App.Templates['layouts/pages/canvasPrints'],
  postersTemplate: App.Templates['layouts/pages/posters'],
  framedPostersTemplate: App.Templates['layouts/pages/framedPosters'],

  events: {
    'click .js-select-size': 'selectSize',
    'click .js-create-print': 'createPrint'
  },

  initialize: function(opts) {
    var products = App.persist.get('products');

    this.router = opts.router;
    this.slug = opts.slug;
    this.size = opts.size;
    this.collection = new Products(products.where({ slug: this.slug }));
    this.model = this.collection.at(0);

    analytics.track('Viewed Product', {
      'Product Model': this.model.get('model')
    });

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

    context.products = this.collection.toJSON();
    context.size = this.size;
    context.defaultProduct = this.collection.at(0).toJSON();

    return context;
  },

  render: function() {
    var template;

    if (this.slug === 'canvas') template = this.canvasTemplate;
    else if (this.slug === 'framed-poster') template = this.framedPostersTemplate;
    else if (this.slug === 'poster') template = this.postersTemplate;

    this.$el.html(template(this.getContext()));
    return this;
  },

  setInitialSize: function() {
    var product;

    if (this.size) {
      product = _.first(this.collection.where({ size: this.size }));
    } else {
      product = this.collection.at(0);
    }

    this.$('.product--size[data-id="' + product.get('id') + '"]').addClass('is-selected');
  },

  selectSize: function(e) {
    var $target = $(e.currentTarget),
        $previous = this.$('.product--size.is-selected'),
        product = this.collection.get($target.attr('data-id'));

    $previous.removeClass('is-selected');
    $target.addClass('is-selected');

    this.$('.product--image').attr('src', product.get('image'));
  },

  createPrint: function() {
    var $selected = this.$('.product--size.is-selected'),
        product = this.collection.get($selected.attr('data-id'));

    this.router.navigate('products/' + this.slug + '/' + product.get('size') + '/create', { trigger: true, replace: false });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = ProductView;