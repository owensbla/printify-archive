var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),

    // Models
    Address = require('../models/address'),
    CartItem = require('../models/cartItem'),
    Order = require('../models/order'),
    OrderItem = require('../models/orderItem'),
    Product = require('../models/product');

var AuthenticatedController = {

  cart: function(req, res) {
    var user = req.user;

    CartItem.objects.find({ user: user.id, isArchived: false }).populate('product').populate('photo').then(function(cartItems) {
      cartItems = _.map(cartItems, function(c) { return c.toJSON(); });
      
      res.render('account/cart', _.extend({
        cartItems: cartItems,
        formattedSubtotal: '$' + parseFloat(_.reduce(cartItems, function(memo, c) { return c.product.price + memo; }, 0.0)).toFixed(2),
        user: user.toJSON()
      }, Helpers.getAppContext()));
    }).catch(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });
  },

  checkout: function(req, res) {
    var user = req.user;

    Address.objects.find({ user: user.id, isArchived: false }).then(function(addresses) {
      return [CartItem.objects.find({ user: user.id, isArchived: false }).populate('product').populate('photo'), addresses];
    }).spread(function(cartItems, addresses) {
      addresses = _.map(addresses, function(a) { return a.toJSON(); });
      cartItems = _.map(cartItems, function(c) { return c.toJSON(); });
      
      res.render('account/checkout', _.extend({
        billingAddresses: _.filter(addresses, function(a) { return a.addressType === 'billing'; }),
        cartItems: cartItems,
        formattedSubtotal: '$' + parseFloat(_.reduce(cartItems, function(memo, c) { return c.product.price + memo; }, 0.0)).toFixed(2),
        shippingAddresses: _.filter(addresses, function(a) { return a.addressType === 'shipping'; }),
        user: user.toJSON()
      }, Helpers.getAppContext()));
    }).catch(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });
  },

  orders: function(req, res) {

    Order.objects.find({ user: req.user.id, status: { 'not': 'failed' }}).sort({ createdAt: 'desc' })
    .populate('orderItems').then(function(orders) {
      orders = _.map(orders, function(o) { return o.toJSON(); });

      res.render('account/orders', _.extend({
        orders: orders,
        user: req.user.toJSON()
      }, Helpers.getAppContext()));
    }).catch(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });

  },

  order: function(req, res) {
    var orderId = parseInt(new Buffer(req.params.encodedId, 'base64').toString('ascii'));

    Order.objects.findOne({ id: orderId }).where({ user: req.user.id, status: { 'not': 'failed' } }).populate('orderItems')
    .then(function(order) {
      if (!order) return res.redirect('/error/404');

      return [order, OrderItem.objects.find().where({ order: orderId }).populate('shipment').populate('photo')];
    }).spread(function(order, orderItems) {
      order = order.toJSON();
      order.orderItems = _.map(orderItems, function(i) { return i.toJSON(); });

      res.render('account/singleOrder', _.extend({
        order: order,
        user: req.user.toJSON()
      }, Helpers.getAppContext()));
    }).catch(function(err) {
      console.trace(err);
      res.redirect('/error/500');
    });

  }

};

module.exports = AuthenticatedController;
