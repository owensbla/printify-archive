var Helpers = require('../../helpers'),
    
    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized;

module.exports = {

  // basic user authorization
  isUser: function(req, res, next) {
    if (req.user.id !== req.body.id) return unauthorized(req, res);
    return next();
  }

};