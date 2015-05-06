var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    Helpers = require('../../helpers'),
    App = Globals.App,

    // Models
    Photo = require('../../models/photo');

var UploadController = Backbone.View.extend({

  events: {
    'click .js-upload-input': 'onClick',
    'change .js-upload-input': 'onChange'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.model = new Photo();

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.bindEvents();
  },

  bindEvents: function() {
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    return this;
  },

  onClick: function(e) {
    if (this.$el.hasClass('disabled')) e.preventDefault();
  },

  onChange: function() {
    if (this.$('.js-upload-input')[0].files.length) this.uploadFile();
  },

  uploadFile: function() {
    var file = this.$('.js-upload-input')[0].files[0],
        _this = this,
        fileSize = file.size,
        policyReq, uploadReq;

    if (fileSize > 52428800) {
      return App.events.trigger('uploadController:uploadError', 'Sorry, the max file size is currently 50MB! Please contact us if you feel that this is too low: hello@printify.io.');
    }

    Helpers.UI.addSpinner(this.$el);

    _this.model.set('file', file);

    policyReq = this.model.signRequest();

    policyReq.done(function(policy) {
      _this.model.set('policy', policy);
      uploadReq = _this.model.upload();

      uploadReq.done(function() {
        App.events.trigger('uploadController:uploadComplete', _this.model);
      });

      uploadReq.fail(function() {
        App.events.trigger('uploadController:uploadError');
      });

      uploadReq.always(function() { Helpers.UI.removeSpinner(_this.$el); });
    });

    policyReq.fail(function(resp) {
      App.events.trigger('uploadController:policyError', resp);
      Helpers.UI.removeSpinner(_this.$el);
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = UploadController;