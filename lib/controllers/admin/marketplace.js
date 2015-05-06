var config = require('../../config/env'),
    Helpers = require('../../helpers'),
    passport = require('passport'),
    _ = require('lodash'),
    AWS = require('aws-sdk'),
    Bluebird = require('bluebird'),
    gm = Bluebird.promisifyAll(require('gm')),
    s3 = new AWS.S3(),
    s3 = Bluebird.promisifyAll(s3),

    // Models
    MarketplaceProduct = require('../../models/marketplaceProduct'),
    Order = require('../../models/order'),
    Photo = require('../../models/photo'),
    Product = require('../../models/product'),
    Variation = require('../../models/variation');

var MarketplaceAdminController = {

  new: function(req, res) {
    Product.objects.find().where({ isActive: true }).then(function(products) {
      res.render('admin/marketplace/new', _.extend({
        product: {},
        products: products,
        layout: 'admin',
        user: req.user
      }, Helpers.getAppContext()));
    }).catch(function(err) { console.trace(err); res.redirect('/a'); });
  },

  create: function(req, res) {
    var productImage = req.files.image,
        productImageKey = 'marketplace/' + (new Date()).getTime() + '_' + productImage.originalname,
        marketplaceProduct;

    s3.putObjectAsync({
      ACL: 'public-read',
      Body: productImage.buffer,
      Bucket: config.s3BucketName,
      ContentType: productImage.mimetype,
      Key: productImageKey
    }).then(function() {

      return MarketplaceProduct.objects.create({
        title: req.body.title,
        description: escape(req.body.description),
        model: req.body.model,
        imageUrl: productImageKey,
        isActive: false
      });

    }).then(function(mp) {
      marketplaceProduct = mp;

      // create all the things for variations
      return Bluebird.all(_.map(req.body.variationProduct, function(variationId, index) {

        var variationImage = _.isArray(req.files['variationImage[]']) ? req.files['variationImage[]'][index] : req.files['variationImage[]'],
            variationFilename = (new Date()).getTime() + '_' + variationImage.originalname,
            variationImageKey = 'marketplace/variation/' + variationFilename,
            cropKey = 'marketplace/variation/THUMB_' + (new Date()).getTime() + '_' + variationImage.originalname;

        // first, upload the original
        return s3.putObjectAsync({
          ACL: 'public-read',
          Body: variationImage.buffer,
          Bucket: config.s3BucketName,
          ContentType: variationImage.mimetype,
          Key: variationImageKey
        }).then(function() {
          // now, create the thumbnail
          var buffer = new Buffer('');

          return new Bluebird(function(resolve, reject) {
            gm(variationImage.buffer)
              .quality(95)
              .resize(300, 300)
              .stream(function(err, stdout, stderr) {
                if (err) return reject(err);

                stdout.on('data', function(data) {
                  buffer = Buffer.concat([buffer, data]);
                });

                stdout.on('end', function(data) {
                  resolve(buffer);
                });
              });
          });

        }).then(function(thumb) {

          // then, upload the thumbnail
          return s3.putObjectAsync({
            ACL: 'public-read',
            Body: thumb,
            Bucket: config.s3BucketName,
            ContentType: variationImage.mimetype,
            Key: cropKey
          });

        }).then(function() {
          
          // now, get the size of the original photo before we save it to the DB
          return new Bluebird(function(resolve, reject) {
            gm(variationImage.buffer)
            .size(function (err, size) {
              if (err) return reject(err);
              return resolve([size.width, size.height]);
            });
          });

        }).spread(function(width, height) {

          // next, create the photo object
          return Photo.objects.create({
            category: 'marketplace',
            filename: variationImage.originalname,
            height: height,
            title: variationImage.originalname,
            size: variationImage.size,
            thumbnailUrl: cropKey,
            url: variationImageKey,
            width: width
          });

        }).then(function(photo) {

          // now, create the variation
          return Variation.objects.create({
            marketplaceProduct: marketplaceProduct.id,
            product: variationId,
            photo: photo.id
          });

        });

      }));

    }).then(function() {
      res.redirect('/a');
    }).catch(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });

  }

};

module.exports = MarketplaceAdminController;
