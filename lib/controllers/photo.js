var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Models
    Photo = require('../models/photo'),

    // Resources
    PhotoResource = require('../api/resources/photo');

var getResource = function(req, res) {
  return new PhotoResource({
    req: req,
    res: res
  });
};

var PhotoController = {

  // clone the current resource (given id, /photo/:id/crop)
  // and create a new cropped version.
  createCrop: function(req, res) {
    var resource = getResource(req, res),
        x = req.body.x,
        y = req.body.y,
        w = req.body.width,
        h = req.body.height;

    resource.getDetail().then(function(photo) {
      return photo.copyForPrint(req.user, {
        x: x,
        y: y,
        w: w,
        h: h
      });
    }).then(function(photo) {
      res.status(200).json(photo.toJSON());
    }).catch(function(err) {
      console.error(err);
      jsonErrorResponse(res);
    });
  },

  // Returns a list of a user's photos
  getList: function(req, res) {
    var resource = getResource(req, res);

    resource.getList().then(function(photos) {
      res.status(200).json(_.map(photos, function(photo) { return photo.toJSON(); }));
    });
  },

  // Returns a single photo
  getDetail: function(req, res) {
    var resource = getResource(req, res);

    resource.getDetail().then(function(photo) {
      res.status(200).json(photo.toJSON());
    });
  },

  // Create a photo
  post: function(req, res) {
    if (req.body.filename) req.body.filename = Helpers.slugify(req.body.filename);

    var resource = getResource(req, res);

    resource.post().then(function(photo) {
      res.status(200).json(photo.toJSON());
    });
  },

  // Edits a photo
  put: function(req, res) {
    var resource = getResource(req, res);

    resource.put().then(function(photos) {
      var photo = _.first(photos);
      res.status(200).json(photo.toJSON());
    });
  },

  delete: function(req, res) {
    var resource = getResource(req, res);

    resource.delete();
  }

};

module.exports = PhotoController;
