var _ = require('lodash');

/**
 * Reusable responses.
 */

module.exports = {

  // Returns a 401 unauthorized response
  unauthorized: function(req, res) {
    return res.status(401).end();
  },

  // Returns a 404 response
  fourOhFour: function(req, res) {
    return res.status(404).end();
  },

  // Returns a 501 not implemented response
  notImplemented: function(req, res) {
    return res.status(501).end();
  },

  jsonErrorResponse: function(res, opts) {
    var errorResponse = {};
    
    opts = opts ? opts : {};
    
    _.defaults(opts, {
      status: 500,
      message: 'Sorry, there was an error during your request. If this problem persists, please contact support@printify.io.',
      errorCode: false
    });
    
    errorResponse[_.isObject(opts.message) ? 'errors' : 'error'] = opts.message;
    if (opts.errorCode) errorResponse.errorCode = opts.errorCode;

    return res.status(opts.status).json(errorResponse);
  }

};