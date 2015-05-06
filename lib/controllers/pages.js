var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),

    // Models
    MarketplaceProduct = require('../models/marketplaceProduct'),
    Product = require('../models/product'),
    Variation = require('../models/variation');

var PagesController = {

  home: function(req, res) {
    res.render('pages/home', _.extend({
      pageTitle: 'Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      user: req.user
    }, Helpers.getAppContext()));
  },

  ping: function(req, res) {
    res.status(200).end();
  },

  about: function(req, res) {
    res.render('pages/about', _.extend({
      pageTitle: 'Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      user: req.user
    }, Helpers.getAppContext()));
  },

  marketplace: function(req, res) {
    MarketplaceProduct.objects.find().where({ isActive: true })
      .paginate({ page: 1, limit: 100 })
      .populate('variations').populate('collection')
      .sort({ createdAt: 'desc' })
      .then(function(products) {
        var productIds = _.map(products, function(product) { return product.id; });

        return [products, Variation.objects.find().where({ marketplaceProduct: productIds }).populate('photo').populate('product')];
      }).spread(function(products, variations) {
        products = _.map(products, function(product) {
          var vs = _.filter(variations, function(v) { return v.marketplaceProduct === product.id; });
          product.variations = vs;
          product = product.toJSON();
          return product;
        });
        
        res.render('pages/marketplace', _.extend({
          pageTitle: 'Custom Canvas Print and Framed Poster Marketplace | Printify.io',
          metaDescription: 'Customer High quality canvas print, poster, and framed poster designs ready for your wall.',
          marketplaceProducts: products,
          user: req.user
        }, Helpers.getAppContext()));
      }).catch(function(err) {
        console.trace(err);
        res.redirect('/error/500');
      });
  },

  marketplaceProduct: function(req, res) {
    var slug = req.params.slug,
        _this = this;

    MarketplaceProduct.objects.findOne({ slug: slug }).where({ isActive: true })
      .populate('variations').populate('collection')
      .then(function(product) {
        if (!product) return res.redirect('/error/404');

        return [product, Variation.objects.find().where({ marketplaceProduct: product.id }).populate('photo').populate('product')];
      }).spread(function(product, variations) {
        product.variations = variations;
        product = product.toJSON();
        
        res.render('pages/marketplaceProduct', _.extend({
          pageTitle: 'Custom Canvas Print and Framed Poster Marketplace | Printify.io',
          metaDescription: 'Customer High quality canvas print, poster, and framed poster designs ready for your wall.',
          marketplaceProduct: product,
          posters: _.filter(product.variations, function(v) { return v.product.slug === 'poster'; }),
          framedPosters: _.filter(product.variations, function(v) { return v.product.slug === 'framed-poster'; }),
          user: req.user
        }, Helpers.getAppContext()));
      }).catch(function(err) {
        console.trace(err);
        res.redirect('/error/500');
      });
  },

  termsOfService: function(req, res) {
    res.render('pages/termsOfService', _.extend({
      pageTitle: 'Terms of Service | Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      user: req.user
    }, Helpers.getAppContext()));
  },

  privacyPolicy: function(req, res) {
    res.render('pages/privacyPolicy', _.extend({
      pageTitle: 'Privacy Policy | Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      user: req.user
    }, Helpers.getAppContext()));
  },

  returns: function(req, res) {
    res.render('pages/returns', _.extend({
      pageTitle: 'Returns | Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      user: req.user
    }, Helpers.getAppContext()));
  },

  shipping: function(req, res) {
    res.render('pages/shipping', _.extend({
      pageTitle: 'Shipping | Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      user: req.user
    }, Helpers.getAppContext()));
  },

  products: function(req, res) {
    Product.objects.find().where({ isActive: true }).then(function(products) {
      products = _.map(products, function(product) { return product.toJSON(); });
      
      res.render('pages/products', _.extend({
        pageTitle: 'Canvas Prints and Posters | Printify.io – Your moments, printed.',
        metaDescription: 'High quality custom canvas prints, posters, and framed posters that will add personality to any room.',
        products: products,
        user: req.user
      }, Helpers.getAppContext()));
    }).fail(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });
  },

  product: function(req, res) {
    var slug = req.params.slug,
        _this = this,
        template;

    Product.objects.find({ sort: 'price' }).where({ slug: slug, isActive: true }).then(function(products) {
      if (!products.length) return res.redirect('/error/404');

      products = _.map(products, function(product) { return product.toJSON(); });

      if (slug === 'canvas') template = 'pages/canvasPrints';
      else if (slug === 'poster') template = 'pages/posters';
      else if (slug === 'framed-poster') template = 'pages/framedPosters';
      
      res.render(template, _.extend({
        defaultProduct: _.first(products),
        pageTitle: _.first(products).formattedModel + 's | Printify.io – Your moments, printed.',
        metaDescription: 'High quality custom canvas prints, posters, and framed posters that will add personality to any room.',
        products: products,
        user: req.user
      }, Helpers.getAppContext()));
    }).fail(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });
  },

  createProduct: function(req, res) {
    var slug = req.params.slug,
        size = req.params.size,
        _this = this;

    Product.objects.find().where({ slug: slug, size: size }).then(function(products) {
      if (!products.length) return res.redirect('/error/404');

      product = _.first(products).toJSON();
      
      res.render('pages/createPrint', _.extend({
        pageTitle: 'Create Print | Printify.io – Your moments, printed.',
        metaDescription: 'High quality custom canvas prints, posters, and framed posters that will add personality to any room.',
        product: product,
        user: req.user
      }, Helpers.getAppContext()));
    }).fail(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });
  },

  error: function(req, res) {
    _.defaults(req.params, { errorCode: 404 });
    var errorCode = req.params.errorCode;

    res.render('pages/error', _.extend({
      pageTitle: 'Printify.io – Your moments, printed.',
      metaDescription: 'The fastest way to order beautiful prints of your photos and graphics. ' +
                       'No hassle, high quality canvas prints, posters, and framed posters.',
      errorCode: errorCode,
      is404: errorCode === '404',
      is500: errorCode === '500',
      user: req.user
    }, Helpers.getAppContext()));
  }

};

module.exports = PagesController;
