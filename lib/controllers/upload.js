var Helpers = require('../helpers'),
    config = require('../config/env'),
    passport = require('passport'),
    AWS = require('aws-sdk'),
    s3 = new AWS.S3(),
    mime = require('mime'),
    moment = require('moment'),
    crypto = require('crypto'),
    _ = require('lodash'),

    // Models
    User = require('../models/user'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse;

var UploadController = {

  signRequest: function(req, res) {
    var filename = Helpers.slugify(req.body.filename),
        mimeType = mime.lookup(req.body.filename),
        expiresAt = moment().utc().add(1, 'hour').toJSON('YYYY-MM-DDTHH:mm:ss Z'),
        fileKey = (new Date()).getTime(),
        policy, base64policy, signature, params, s3Key;

    if (!_.contains(config.ALLOWED_FILE_TYPES, mimeType)) {
      return res.status(400).json({ error: 'Only the following file types are currently supported: PNG, JPEG, TIFF.' });
    }

    s3Key = req.user.getBucketDir() + '/' + fileKey + '_' + filename;

    policy = JSON.stringify({
      expiration: expiresAt,
      conditions: [
        { bucket: config.s3BucketName },
        { acl: 'public-read' },
        [ 'eq', '$key', s3Key ],
        [ 'starts-with', '$Content-Type', mimeType ],
        [ 'content-length-range', 0, config.maxFileSize ]
      ]
    });

    base64policy = new Buffer(policy).toString('base64');
    signature = crypto.createHmac('sha1', config.aws.secretAccessKey).update(base64policy).digest('base64');

    res.json({
      accessKeyId: config.aws.accessKeyId,
      acl: 'public-read',
      contentType: mimeType,
      key: s3Key,
      policy: base64policy,
      signature: signature,
      bucketUrl: config.s3BucketUrl,
      fullUrl: config.s3BucketUrl + s3Key
    });
  }

};

module.exports = UploadController;