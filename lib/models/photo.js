/**
 * Photo Model
 *
 * A user uploaded photograph.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    Helpers = require('../helpers'),
    AWS = require('aws-sdk'),
    Bluebird = require('bluebird'),
    gm = Bluebird.promisifyAll(require('gm')),
    s3 = new AWS.S3(),
    s3 = Bluebird.promisifyAll(s3),
    uuid = require('node-uuid'),
    mime = require('mime');

/* Attributes (fields on the model) */
var Attributes = {

  category: {
    defaultsTo: 'upload',
    type: 'string'
  },

  filename: {
    required: true,
    type: 'string'
  },

  height: {
    required: true,
    type: 'integer'
  },

  isArchived: {
    defaultsTo: false,
    type: 'boolean'
  },

  original: {
    defaultsTo: null,
    model: 'photo'
  },

  title: {
    required: true,
    type: 'string'
  },

  size: {
    defaultsTo: 0,
    type: 'integer'
  },

  slug: {
    required: true,
    type: 'string'
  },

  status: {
    defaultsTo: 'uploadComplete',
    type: 'string'
  },

  thumbnailUrl: {
    defaultsTo: '',
    type: 'string'
  },

  user: {
    defaultsTo: null,
    model: 'user'
  },

  url: {
    required: true,
    type: 'string'
  },

  width: {
    required: true,
    type: 'integer'
  },

  variations: {
    collection: 'variation',
    via: 'photo'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  copyForPrint: function(user, opts) {
    var _this = this,
        fileKey = (new Date()).getTime(),
        contentType = mime.lookup(this.filename),
        s3Key, cropKey, thumbKey;

    // if the new photo has the same width and height, we only copy it and create a new one
    if (opts.w === this.width && opts.h === this.height) {

      s3Key = user.getBucketDir() + '/' + fileKey + '_' + _this.filename;
      
      var getParams = {
            Bucket: config.s3BucketName,
            Key: this.url
          };

      // grab the object
      return this.getFromS3().then(function(data) {
        
        // copy it over to the new key
        return [data.Body, s3.putObjectAsync({
          ACL: 'public-read',
          Body: data.Body,
          Bucket: config.s3BucketName,
          ContentType: contentType,
          Key: s3Key
        })];

      }).spread(function(copy) {

        var buffer = new Buffer('');

        // create the thumbnail
        return [copy, new Bluebird(function(resolve, reject) {
          gm(copy)
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
        })];

      }).spread(function(copy, thumb) {

        thumbKey = user.getBucketDir() + '/' + fileKey + '_THUMB_' + _this.filename;
        
        // save the thumb
        return [copy, thumb, s3.putObjectAsync({
          ACL: 'public-read',
          Body: thumb,
          Bucket: config.s3BucketName,
          ContentType: contentType,
          Key: thumbKey
        })];

      }).then(function() {
        
        // create and return the new photo object
        return Photo.objects.create({
          category: 'print',
          filename: _this.filename,
          height: _this.height,
          original: _this.id,
          title: _this.title,
          size: _this.size,
          thumbnailUrl: thumbKey,
          url: s3Key,
          user: user.id,
          width: _this.width
        });

      });

    } else { // otherwise, we do crop it first.

      // grab the photo
      return this.getFromS3().then(function(data) {
        var buffer = new Buffer('');

        // create the full size cropped version
        return new Bluebird(function(resolve, reject) {
          gm(data.Body)
          .quality(100)
          .crop(opts.w, opts.h, opts.x, opts.y)
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

      }).then(function(crop) {

        cropKey = user.getBucketDir() + '/' + fileKey + '_CROP_' + _this.filename;
        
        // save the full size crop to S3
        return [crop, s3.putObjectAsync({
          ACL: 'public-read',
          Body: crop,
          Bucket: config.s3BucketName,
          ContentType: contentType,
          Key: cropKey
        })];

      }).spread(function(crop) {

        var buffer = new Buffer('');
        
        // create the thumbnail
        return [crop, new Bluebird(function(resolve, reject) {
          gm(crop)
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
        })];

      }).spread(function(crop, thumb) {

        thumbKey = user.getBucketDir() + '/' + fileKey + '_THUMB_' + _this.filename;
        
        // save the thumb
        return [crop, thumb, s3.putObjectAsync({
          ACL: 'public-read',
          Body: thumb,
          Bucket: config.s3BucketName,
          ContentType: contentType,
          Key: thumbKey
        })];

      }).spread(function(crop, thumb) {

        // create and return the new photo object
        return Photo.objects.create({
          category: 'print',
          filename: _this.filename,
          height: opts.h,
          original: _this.id,
          title: _this.title,
          size: crop.length,
          thumbnailUrl: thumbKey,
          url: cropKey,
          user: user.id,
          width: opts.w
        });

      });

    }
  },

  getFromS3: function() {
    return s3.getObjectAsync({
      Bucket: config.s3BucketName,
      Key: this.url
    });
  },

  getFullUrl: function() {
    return config.s3BucketUrl + this.url;
  },

  getFullThumbnailUrl: function() {
    if (!this.thumbnailUrl) return this.thumbnailUrl;
    return config.s3BucketUrl + this.thumbnailUrl;
  },

  /* This method is called before sending the user data back to the client. */
  toJSON: function() {
    var obj = _.clone(this.toObject());

    obj.fullUrl = this.getFullUrl();
    obj.fullThumbnailUrl = this.getFullThumbnailUrl();

    if (typeof this.user === 'object' && this.user) obj.user = this.user.toJSON();

    delete obj.isArchived;

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

  beforeValidate: function(values, next) {
    values.slug = Helpers.slugify(values.title);
    next();
  }

};

/* Create the Waterline.Collection */
var Photo = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'photo',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = Photo;