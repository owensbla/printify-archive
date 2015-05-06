var _ = require('lodash'),
    config = require('../../config/env'),
    
    OwnerResource = require('./_ownerResource'),
    Address = require('../../models/address');

var AddressResource = OwnerResource.extend({

  Model: Address,

  readOnlyFields: [
    'isArchived',
    'user'
  ],

  where: {
    isArchived: false
  },

  post: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        address;

    address = {
      address1: req.body.address1,
      address2: req.body.address2,
      addressType: req.body.addressType,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      country: req.body.country,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      user: req.user.id
    };

    // see if this address exists first, if it does then return it instead of creating a new one
    return Address.objects.findOne(address).then(function(existing) {
      if (!existing) { return OwnerResource.prototype.post.call(_this); }
      return existing;
    });
  }

});


module.exports = AddressResource;