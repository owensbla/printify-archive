var Backbone = require('backbone'),
    _ = require('lodash'),
    $ = require('jquery');

var TRANSITION_DURATION = 300;

var Modal = function(opts) {
  opts = opts ? opts : {};

  _.defaults(opts, {
    className: 'dinghy--modal',
    selfDestruct: false,
    title: '',
    template: '<div>' +
                '<div class="modal--backdrop js-close-modal"></div>' +
                '<div class="modal--content js-content">' +
                '</div>' +
              '</div>',
  });

  this.initialize.call(this, opts, arguments);
};

Modal.prototype = {

  initialize: function(opts) {
    this.template = opts.template;
    this.title = opts.title;
    this.selfDestruct = opts.selfDestruct;
    this.$el = $(this.template).addClass(opts.className);
    this.render();
    this.bindEvents();
  },

  bindEvents: function() {
    this.$el.find('.js-close-modal').on('click', _.bind(this.hideModal, this));
  },

  unbindEvents: function() {
    this.$el.find('.js-close-modal').off('click');
    this.stopListening();
  },

  setContent: function(html) {
    this.$el.find('.js-content').html(html);
  },

  showModal: function() {
    this.$el.addClass('is-shown');
    this.trigger('shown');
  },

  hideModal: function() {
    var _this = this;

    this.$el.addClass('fade-out');

    setTimeout(function() {
      _this.$el.removeClass('is-shown fade-out');
      _this.trigger('hidden');
      if (_this.selfDestruct) { _this.close(); }
    }, TRANSITION_DURATION);
  },

  render: function() {
    $('body').append(this.$el);
    this.$el.find('.js-title').html(this.title);
  },

  close: function() {
    this.hideModal();
    this.unbindEvents();
    this.$el.remove();
  }

};

_.extend(Modal.prototype, Backbone.Events);

module.exports = Modal;