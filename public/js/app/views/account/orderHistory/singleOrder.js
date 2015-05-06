var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../../globals'),
    App = Globals.App,

    Order = require('../../../models/order');

var OrderHistoryView = Backbone.View.extend({
  
  template: App.Templates['layouts/account/singleOrder'],

  events: {

  },

  initialize: function(opts) {
    var _this = this,
        req;

    this.router = opts.router;

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    if (!this.model) {
      this.model = new Order({ id: opts.id });
      req = this.model.fetch();
      req.done(function() { _this.trigger('ready'); });
      req.fail(function() { _this.router.navigate('error/404', { trigger: true, replace: true }); });
      if (App.state.get('initialLoad')) this.trigger('ready');
    } else {
      this.trigger('ready');
    }
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

    context.order = this.model.toJSON();

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = OrderHistoryView;