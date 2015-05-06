var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    App = Globals.App;

var FooterView = Backbone.View.extend({

  events: {
    'click .js-go-returns': 'gotoReturns',
    'click .js-go-tos': 'gotoTermsOfService',
    'click .js-go-privacy': 'gotoPrivacyPolicy',
    'click .js-go-shipping': 'gotoShipping',
    'click .js-twitter': 'trackTwitter',
    'click .js-facebook': 'trackFacebook',
    'click .js-pinterest': 'trackPinterest',
    'click .js-instagram': 'trackInstagram'
  },

  initialize: function(opts) {
    this.router = opts.router;

    this.setElement(Globals.FOOTER_ELEMENT);

    this.delegateEvents();
  },

  gotoReturns: function(e) {
    e.preventDefault();
    this.router.navigate('returns', { trigger: true, replace: false });
  },

  gotoTermsOfService: function(e) {
    e.preventDefault();
    this.router.navigate('terms-of-service', { trigger: true, replace: false });
  },

  gotoPrivacyPolicy: function(e) {
    e.preventDefault();
    this.router.navigate('privacy-policy', { trigger: true, replace: false });
  },

  gotoShipping: function(e) {
    e.preventDefault();
    this.router.navigate('shipping', { trigger: true, replace: false });
  },

  trackTwitter: function() {
    analytics.track('Clicked Twitter', {
      'Location': 'Footer'
    });
  },

  trackFacebook: function() {
    analytics.track('Clicked Facebook', {
      'Location': 'Footer'
    });
  },

  trackPinterest: function() {
    analytics.track('Clicked Pinterest', {
      'Location': 'Footer'
    });
  },

  trackInstagram: function() {
    analytics.track('Clicked Instagram', {
      'Location': 'Footer'
    });
  },

  onClose: function() {}

});

module.exports = FooterView;