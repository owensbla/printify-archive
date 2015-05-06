var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App;

var User = Backbone.Model.extend({

  defaults: {
    isActive: false,
    id: -1
  },

  changeEmail: function() {},
  changePassword: function() {},
  forgotPassword: function() {},

  signIn: function(userData) {
    var _this = this,
        req;

    req = $.ajax({
      contentType: 'application/json',
      data: JSON.stringify(userData),
      dataType: 'json',
      type: 'POST',
      url: this.urlRoot() + '/login/',
    });

    req.done(function(resp) {
      _this.set(resp);
    });

    return req;
  },

  signOut: function() {
    var _this = this,
        req;

    req = $.ajax({
      data: {},
      contentType: 'application/json',
      type: 'POST',
      url: this.urlRoot() + '/logout/',
    });

    req.done(function() {
      _this.clear({ silent: true });
      _this.set({
        id: -1,
        isActive: false
      });
    });

    req.fail(function(resp) {
      if (resp.status === 401) {
        _this.clear({ silent: true });
        _this.set({
          id: -1,
          isActive: false
        }); 
      }
    });

    return req;
  },

  register: function(userData) {
    var _this = this,
        req;

    req = $.ajax({
      data: JSON.stringify(userData),
      contentType: 'application/json',
      type: 'POST',
      url: this.urlRoot() + '/signup/'
    });

    req.done(function(resp) {
      _this.set(resp);
    });

    return req;
  },

  validateEmail: function(email) {
    email = email ? email : this.get('email');

    if (!~email.indexOf('@')) {
      return 'You must enter a valid email.';
    }

    return true;
  },

  validatePassword: function(password) {
    password = password ? password : this.get('password');

    if (password.length < 8 || password.length > 30) {
      return 'Your password must be 8 to 30 characters.';
    }

    return true;
  },

  toJSON: function() {
    var attrs = _.clone(this.attributes);

    return attrs;
  },

  urlFragment: 'user',

  url: function() {
    if (this.get('id') === -1 || App.session.isSignedIn()) {
      return this.urlRoot() + '/session/';
    } else {
      return this.urlRoot();
    }
  }

});

module.exports = User;