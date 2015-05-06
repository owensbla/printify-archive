// Fetches products from Printful and loads them in to the database.

var config = require('../config/env'),
    Printful = require('../utils/printful'),
    _ = require('lodash'),
    Task = require('./_baseTask'),
    Product = require('../models/product'),
    Helpers = require('../helpers'),
    argv = require('minimist')(process.argv.slice(2));

var PRODUCT_TYPES = ['POSTER', 'FRAMED-POSTER', 'CANVAS']; // 'FRAMED-PRINT'

var FetchProducts = Task.extend({

  initialize: function() {
    console.log('THIS TASK HAS BEEN DISABLED. CHECK THE CODES.');

    // this.printfulClient = new Printful(config.PRINTFUL_KEY);

    // this.forceUpdate = argv.f === true;

    // // load in the database then fetch the products
    // require('../config/database')(_.bind(this.fetchProducts, this));
  },

  onError: function(err) {
    console.log(err);
  },

  fetchProducts: function() {
    console.log('Fetching Products');
    this.printfulClient.get('products').success(_.bind(this.parseProducts, this)).error(this.onError);
  },

  parseProducts: function(products) {
    console.log('Parsing Products');

    var _this = this;

    _.each(products, function(product) {
      if (_.contains(PRODUCT_TYPES, product.type)) {
        _this.fetchVariants(product);
      }
    });
  },

  fetchVariants: function(product) {
    console.log('Fetching Variants for: ' + product.model);
    this.printfulClient.get('products/' + product.id).success(_.bind(this.parseVariants, this)).error(this.onError);
  },

  parseVariants: function(resp) {
    console.log('Parsing Variants');

    var variants = resp.variants,
        product = resp.product,
        _this = this;

    _.each(variants, function(variant) {
      _this.saveVariant(product, variant);
    });
  },

  saveVariant: function(product, variant) {
    var normalizedSize = variant.size.split('×')[0] + 'x' + variant.size.split('×')[1],
        _this = this;

    var createProduct = function() {
      Product.objects.create({
        externalId: variant.id,
        externalPrice: variant.price,
        image: 'https://s3-us-west-2.amazonaws.com/printify.io/assets/product-images/' + Helpers.slugify(product.model) + '-' + normalizedSize + '.jpg',
        model: product.model,
        name: variant.name,
        price: Helpers.calculateResalePrice(variant, product),
        provider: 'printful',
        size: normalizedSize
      }).exec(function(err, created) {
        if (err) console.log(err);
        else console.log('Created product "' + created.name + '"');
      });
    };

    var updateProduct = function(existing) {
      Product.objects.update({ id: existing.id }, {
        externalPrice: variant.price,
        model: product.model,
        name: variant.name,
        // price: Helpers.calculateResalePrice(variant.price),
        size: variant.size
      }).exec(function(err, updated) {
        if (err) console.log(err);
        else console.log('Updated product "' + _.first(updated).name + '"');
      });
    };

    var forceUpdateProduct = function(existing) {
      Product.objects.update({ id: existing.id }, {
        externalPrice: variant.price,
        image: 'https://s3-us-west-2.amazonaws.com/printify.io/assets/product-images/' + Helpers.slugify(product.model) + '-' + normalizedSize + '.jpg',
        model: product.model,
        name: variant.name,
        price: Helpers.calculateResalePrice(variant, product),
        size: normalizedSize
      }).exec(function(err, updated) {
        if (err) console.log(err);
        else console.log('Force updated product "' + _.first(updated).name + '"');
      });
    };

    Product.objects.findOne({ externalId: variant.id }).then(function(existing) {
      if (existing && _this.forceUpdate) {
        forceUpdateProduct(existing);
      } else if (existing && !_this.forceUpdate) {
        updateProduct(existing);
      } else {
        createProduct();
      }
    }).fail(function(err) {
      console.log(err);
    });
  }

});

new FetchProducts();