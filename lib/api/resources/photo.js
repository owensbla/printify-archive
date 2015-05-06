var _ = require('lodash'),
    config = require('../../config/env'),
    
    OwnerResource = require('./_ownerResource'),
    Photo = require('../../models/photo'),

    UserMailer = require('../../mailers/user');

var PhotoResource = OwnerResource.extend({

  Model: Photo,

  readOnlyFields: [
    'slug',
    'status',
    'thumb100Url',
    'thumb200Url',
    'thumb300Url',
    'user'
  ],

  createOnlyFields: [
    'height',
    'size',
    'width'
  ],

  where: {
    isArchived: false
  },

  // override to "archive" rather than delete
  delete: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        modelId = req.params.id;

    this.req.body = {
      isArchived: true
    };

    return this.put().then(function(models) {
      return res.status(204).end();
    }).catch(function(err) {
      console.error(err);
      return res.status(500).end();
    });
  }

});


module.exports = PhotoResource;