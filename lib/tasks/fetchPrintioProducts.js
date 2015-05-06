var extend = require('../utils/extend'),
    _ = require('lodash'),
    Task = require('./_baseTask'),
    Printio = require('../utils/printio'),
    Product = require('../models/product'),
    Helpers = require('../helpers'),
    argv = require('minimist')(process.argv.slice(2)),
    Bluebird = require('bluebird');

var PRODUCT_UIDS = ['Professional Prints', 'Framed Prints', 'Canvas Wraps'];

var FetchPrintioProducts = Task.extend({

  initialize: function() {
    this.client = new Printio();

    this.forceUpdate = argv.f === true;

    // load in the database then fetch the products
    require('../config/database')(_.bind(this.fetchProducts, this));
  },

  onError: function(err) {
    console.error(err);
  },

  fetchProducts: function() {
    console.log('Fetching Products');
    this.client.get('products').then(_.bind(this.parseProducts, this)).catch(this.onError);
  },

  parseProducts: function(resp) {
    console.log('Parsing Products');

    var _this = this,
        products = resp.Products;

    _.each(products, function(product) {
      if (_.contains(PRODUCT_UIDS, product.UId)) _this.fetchVariants(product);
    });
  },

  fetchVariants: function(product) {
    var _this = this;

    console.log('Fetching Variants for: ' + product.Name);
    this.client.get('productVariants', { productId: product.Id }).then(function(resp) {
      _this.parseVariants(product, resp.ProductVariants);
    }).catch(this.onError);
  },

  parseVariants: function(product, variants) {
    console.log('Parsing Variants');

    var _this = this;

    _.each(variants, function(variant, index) {
      _.delay(function() {
        _this.saveVariant(product, variant);
      }, index * 20);
    });
  },

  saveVariant: function(product, variant) {
    var _this = this,
        normalizedSize;

    normalizedSize = _.find(variant.Options, function(opt) {
      return _.contains(['Print Size', 'Size', 'Canvas Size'], opt.Name);  
    }).Value.replace('inch', '').replace(' ', '');

    // switch (product.Name) {
    //   case 'Professional Prints':
    //     var printMaterial = _.find(variant.Options, function(opt) { return opt.Name === 'Print Material'; }).Value;
    //     if (printMaterial !== 'Lustre') return;
    //     break;
    // }

    var createProduct = function() {
      Product.objects.create({
        externalSku: variant.Sku,
        externalPrice: variant.PriceInfo.Price,
        image: 'https://s3-us-west-2.amazonaws.com/printify.io/assets/product-images/' + Helpers.slugify(product.Name) + '-' + normalizedSize + '.jpg',
        isPublic: false,
        model: product.Name,
        name: product.Name + ' ' + normalizedSize,
        price: variant.PriceInfo.Price,
        provider: 'printio',
        size: normalizedSize
      }).exec(function(err, created) {
        if (err) console.log(err);
        else console.log('Created product "' + created.name + '"');
      });
    };

    var updateProduct = function(existing) {
      Product.objects.update({ id: existing.id }, {
        externalPrice: variant.PriceInfo.Price,
        model: product.Name,
        name: product.Name + ' ' + normalizedSize,
        price: variant.PriceInfo.Price,
        size: normalizedSize
      }).exec(function(err, updated) {
        if (err) console.log(err);
        else console.log('Updated product "' + _.first(updated).name + '"');
      });
    };

    var forceUpdateProduct = function(existing) {
      Product.objects.update({ id: existing.id }, {
        externalPrice: variant.PriceInfo.Price,
        image: 'https://s3-us-west-2.amazonaws.com/printify.io/assets/product-images/' + Helpers.slugify(product.Name) + '-' + normalizedSize + '.jpg',
        model: product.Name,
        name: product.Name + ' ' + normalizedSize,
        price: variant.PriceInfo.Price,
        size: normalizedSize
      }).exec(function(err, updated) {
        if (err) console.log(err);
        else console.log('Force updated product "' + _.first(updated).name + '"');
      });
    };

    Product.objects.findOne({ externalSku: variant.Sku }).then(function(existing) {
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

new FetchPrintioProducts();