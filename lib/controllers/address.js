var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Models
    Address = require('../models/address'),

    // Resources
    AddressResource = require('../api/resources/address');

var getResource = function(req, res) {
  return new AddressResource({
    req: req,
    res: res
  });
};

var AddressController = {

  // Returns a list of a user's addresses
  getList: function(req, res) {
    var resource = getResource(req, res);

    resource.getList().then(function(addresses) {
      res.status(200).json(_.map(addresses, function(address) { return address.toJSON(); }));
    });
  },

  // Returns a single address
  getDetail: function(req, res) {
    var resource = getResource(req, res);

    resource.getDetail().then(function(address) {
      res.status(200).json(address.toJSON());
    });
  },

  // Create a address
  post: function(req, res) {
    var resource = getResource(req, res);

    resource.post().then(function(address) {
      res.status(200).json(address.toJSON());
    });
  },

  // Edits a address
  put: function(req, res) {
    var resource = getResource(req, res);

    resource.put().then(function(addresses) {
      var address = _.first(addresses);
      res.status(200).json(address.toJSON());
    });
  },

  delete: function(req, res) {
    var resource = getResource(req, res);

    resource.delete();
  }

};

module.exports = AddressController;
