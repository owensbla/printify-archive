var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),
    bugsnag = require('bugsnag'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Models
    MarketplaceProduct = require('../models/marketplaceProduct'),
    Variation = require('../models/variation');

var MarketplaceController = {

  // Returns a list of a product
  getList: function(req, res) {
    MarketplaceProduct.objects.find().where({ isActive: true })
      .paginate({ page: 1, limit: 100 })
      .populate('variations').populate('collection')
      .sort({ createdAt: 'desc' })
      .then(function(products) {
        var productIds = _.map(products, function(product) { return product.id; });

        return [products, Variation.objects.find().where({ marketplaceProduct: productIds, isActive: true }).populate('photo').populate('product')];
      }).spread(function(products, variations) {
        products = _.map(products, function(product) {
          var vs = _.filter(variations, function(v) { return v.marketplaceProduct === product.id; });
          product.variations = _.map(vs, function(v) { delete v.url; delete v.fullUrl; return v; });
          product = product.toJSON();
          return product;
        });
        res.status(200).json(products);
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ControllerError:Marketplace' });
        jsonErrorResponse(res);
      });
  },

  // Returns a single product
  getDetail: function(req, res) {
    var productId = req.params.id;

    MarketplaceProduct.objects.findOne({ id: productId }).where({ isActive: true }).populate('variations').populate('collection')
    .then(function(product) {
      if (!product) return res.status(404).end();

      return [product, Variation.objects.find().where({ marketplaceProduct: product.id, isActive: true }).populate('product').populate('photo')];
    }).spread(function(product, variations) {
      product.variations = _.map(variations, function(v) { delete v.url; delete v.fullUrl; return v; });
      product = product.toJSON();

      res.status(200).json(product);
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ControllerError:Marketplace' });
      jsonErrorResponse(res);
    });
  }

};

module.exports = MarketplaceController;
