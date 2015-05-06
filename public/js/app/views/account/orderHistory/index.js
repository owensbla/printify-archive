var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App,

    // Collection
    Orders = require('../../../collections/orders');

var OrderHistoryView = Backbone.View.extend({
  
  template: App.Templates['layouts/account/orders'],

  events: {
    'click .js-go-order': 'gotoOrder'
  },

  initialize: function(opts) {
    var _this = this,
        req;

    this.router = opts.router;
    this.collection = new Orders(); // todo: cache

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    req = this.collection.fetch();

    req.done(function() { _this.trigger('ready'); });
    req.fail(function() { _this.router.navigate('error/500', { trigger: true, replace: true }); });
  },

  onReady: function() {
    if (App.state.get('initialLoad')) { this.bindEvents(); App.state.set('loading', false); return; }

    this.render().bindEvents();

    App.state.set('loading', false);
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

    context.orders = this.collection.toJSON();

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  gotoOrder: function(e) {
    e.preventDefault();
    var orderId = $(e.currentTarget).attr('data-id');
    this.router.navigate('account/orders/' + orderId, { trigger: true, replace: false });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = OrderHistoryView;