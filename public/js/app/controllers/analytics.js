var _ = require('lodash'),
    Backbone = require('backbone'),
    Helpers = require('../helpers'),
    Globals = require('../globals'),
    App = Globals.App;

var AnalyticsController = Backbone.View.extend({

  initialize: function() {
    var _this = this;

    this.bindEvents();
    this.trackSession();
  },

  bindEvents: function() {},

  identify: function(traits) {
    traits = traits ? traits : {};

    var user = App.session.getSession();

    if (!user.get('isActive')) return;

    analytics.identify(user.get('id'), _.extend({
      avatar: user.get('thumb200'),
      createdAt: user.get('createdAt'),
      email: user.get('email'),
      firstName: user.get('firstName'),
      id: user.get('id'),
      lastName: user.get('lastName'),
      lastSeen: new Date(),
      name: user.get('fullName') || user.get('email'),
      username: user.get('username')
    }, traits));
  },

  getUtmData: function() {
    var utm = {};

    if (App.persist.get('utm_source')) utm.source = App.persist.get('utm_source');
    if (App.persist.get('utm_medium')) utm.medium = App.persist.get('utm_medium');
    if (App.persist.get('utm_term')) utm.term = App.persist.get('utm_term');
    if (App.persist.get('utm_content')) utm.content = App.persist.get('utm_content');
    if (App.persist.get('utm_campaign')) utm.campaign = App.persist.get('utm_campaign');

    return utm;
  },

  track: analytics.track,

  trackSession: function() {
    var utm = this.getUtmData();
    
    this.identify();
    
    analytics.track('Session Started', _.extend({

    }, utm));
  },

  trackSignIn: function() {
    var utm = this.getUtmData();

    this.identify();

    analytics.track('Signed In', _.extend({

    }, utm));
  },

  trackSignOut: function() {
    var utm = this.getUtmData();

    analytics.track('Signed Out', _.extend({

    }, utm));
  },

  trackRegistration: function() {
    var utm = this.getUtmData();

    this.identify(utm);

    analytics.track('Created Account', _.extend({

    }, utm));
  },

  trackCheckout: function(total) {
    
  },


});

module.exports = AnalyticsController;