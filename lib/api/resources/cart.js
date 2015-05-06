var _ = require('lodash'),
    config = require('../../config/env'),
    bugsnag = require('bugsnag'),
    
    OwnerResource = require('./_ownerResource'),
    
    CartItem = require('../../models/cartItem'),
    Product = require('../../models/product'),
    Photo = require('../../models/photo');

var CartResource = OwnerResource.extend({

  Model: CartItem,

  readOnlyFields: [
    'isArchived',
    'user',
  ],

  createOnlyFields: [
    'photo',
    'product'
  ],

  populate: ['product', 'photo'],

  where: { isArchived: false },

  put: function() {
    return OwnerResource.prototype.put.call(this).then(function(cartItems) {
        var cartItem = _.first(cartItems);
        return CartItem.objects.findOne({ id: cartItem.id, isArchived: false }).populate('product').populate('photo');
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ApiResourceError:Cart' });
        res.status(500).end();
        return false;
      });
  },

  post: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        photoId = req.body.photo,
        productId = req.body.product;

    return Photo.objects.findOne({ id: photoId }).then(function(model) {
      if (!model) {
        return _this.jsonErrorResponse(res, {
          message: 'That photo doesn\'t exist!',
          status: 400
        });
      }
      if (model.user && model.user !== req.user.id) {
        return _this.jsonErrorResponse(res, {
          message: 'That photo isn\'t yours!',
          status: 400
        });
      }
      return true;
    }).then(function() {
      return Product.objects.findOne({ id: productId });
    }).then(function(model) {
      if (!model) {
        return _this.jsonErrorResponse(res, {
          message: 'That product doesn\'t exist!',
          status: 400
        });
      }
      return true;
    }).then(function() {
      return OwnerResource.prototype.post.call(_this);
    }).then(function(created) {
      return CartItem.objects.findOne({ id: created.id, isArchived: false }).populate('product').populate('photo');
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ApiResourceError:Cart' });
      res.status(500).end();
      return false;
    });
  }

});


module.exports = CartResource;