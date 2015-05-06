var Helpers = require('../helpers'),
    bugsnag = require('bugsnag'),
    
    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized;

module.exports = {

  // basic authentication
  isAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) return res.redirect('/');
    next();
  },

  // basic authentication
  isAuthenticatedApi: function(req, res, next) {
    if (req.isAuthenticated()) return next();
    unauthorized(req, res);
  }

};