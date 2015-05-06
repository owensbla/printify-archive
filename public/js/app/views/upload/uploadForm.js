var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App,

    // Models
    Photo = require('../../models/photo');

var UploadForm = Backbone.View.extend({
  
  template: App.Templates['partials/upload/uploadForm'],

  events: {
    'submit .js-upload-form': 'upload'
  },

  initialize: function(opts) {
    this.router = opts.router;
    this.model = new Photo();

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    this.render().bindEvents();
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

  upload: function() {
    var file = this.$('.js-upload')[0].files[0],
        _this = this,
        req;

    req = this.model.signRequest(file.name);
    req.done(function(policy) {
      _this.model.upload(file, policy);
    });
  },

  onClose: function() {
    this.unbindEvents();
  }

});

module.exports = UploadForm;