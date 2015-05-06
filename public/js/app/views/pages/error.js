var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App;

var ErrorPageView = Backbone.View.extend({
  
  template: App.Templates['layouts/pages/error'],

  events: {

  },

  initialize: function(opts) {
    this.router = opts.router;
    this.errorPage = opts.errorPage;

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    if (App.state.get('initialLoad')) { this.render().bindEvents(); App.state.set('loading', false); return; }

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

    context.is404 = this.errorPage === '404';
    context.is500 = this.errorPage === '500';
    
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

module.exports = ErrorPageView;