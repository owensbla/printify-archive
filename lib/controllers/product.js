var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Models
    Product = require('../models/product'),

    // Resources
    ProductResource = require('../api/resources/product');

var getResource = function(req, res) {
  return new ProductResource({
    req: req,
    res: res
  });
};

var ProductController = {

  // Returns a list of a product
  getList: function(req, res) {
    var resource = getResource(req, res);

    resource.getList().then(function(products) {
      res.status(200).json(_.map(products, function(product) { return product.toJSON(); }));
    });
  },

  // Returns a single product
  getDetail: function(req, res) {
    var resource = getResource(req, res);

    resource.getDetail().then(function(product) {
      res.status(200).json(product.toJSON());
    });
  }

};

module.exports = ProductController;
