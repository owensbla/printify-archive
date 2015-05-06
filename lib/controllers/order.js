var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),
    Bluebird = require('bluebird'),
    bugsnag = require('bugsnag'),
    config = require('../config/env'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Mailer
    OrderMailer = require('../mailers/order'),

    // Validations
    OrderValidator = require('../api/validators/order'),

    // Models
    CartItem = require('../models/cartItem'),
    CreditCard = require('../models/creditCard'),
    Order = require('../models/order'),
    OrderItem = require('../models/orderItem'),
    PromoCode = require('../models/promoCode'),
    User = require('../models/user');

var OrderController = {

  // Returns a list of a user's orders
  getList: function(req, res) {
    var page = req.query.page || 1,
        limit = req.query.limit || 40,
        _this = this;

    Order.objects.find().where({ user: req.user.id, status: { 'not': 'failed' } }).populate('orderItems')
    .paginate({ page: page, limit: limit }).sort({ createdAt: 'desc' }).then(function(orders) {

      var orderIds = _.map(orders, function(order) { return order.id; });

      return [orders, OrderItem.objects.find().where({ order: orderIds }).populate('shipment').populate('photo')];

    }).spread(function(orders, orderItems) {
      orders = _.map(orders, function(order) {
        var items = _.filter(orderItems, function(i) { return i.order === order.id; });
        order = order.toJSON();
        order.orderItems = _.map(items, function(i) { return i.toJSON(); });
        return order;
      });
      res.status(200).json(orders);
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ControllerError:Order' });
      jsonErrorResponse(res);
    });
  },

  // Returns a single order
  getDetail: function(req, res) {
    var orderId = parseInt(new Buffer(req.params.encodedId, 'base64').toString('ascii'));

    Order.objects.findOne({ id: orderId }).where({ user: req.user.id, status: { 'not': 'failed' } }).populate('orderItems')
    .then(function(order) {
      if (!order) return res.status(404).end();

      return [order, OrderItem.objects.find().where({ order: orderId }).populate('shipment').populate('photo')];
    }).spread(function(order, orderItems) {
      order = order.toJSON();
      order.orderItems = _.map(orderItems, function(i) { return i.toJSON(); });

      res.status(200).json(order);
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ControllerError:Order' });
      jsonErrorResponse(res);
    });
  },

  // TODO: Create an order without relying on cart items
  post: function(req, res) {
    var user = req.user,
        _this = this,
        orderObject = {},
        cartItems = false,
        cardId = req.body.creditCard,
        promoCode = req.body.promoCode ? req.body.promoCode : false,
        userCard, userOrder, orderItems;

    // validate request params
    var validator = new OrderValidator({ req: req, res: res }),
        isValid = validator.validate();
    if (isValid !== true) return jsonErrorResponse(res, isValid);

    // first, make sure the user is charged a valid card
    CreditCard.objects.findOne({ user: user.id, id: cardId }).then(function(creditCard) {
      if (!creditCard) return jsonErrorResponse(res, { message: 'Oops! It doesn\'t look like that credit card exists.', status: 400 });
      userCard = creditCard;

      // add payment method fields to orderObject
      orderObject.paymentCardType = creditCard.cardType;
      orderObject.paymentLast4 = creditCard.last4;
      orderObject.paymentExpirationDate = creditCard.expirationDate;
      orderObject.paymentBraintreeToken = creditCard.braintreeToken;

      // now, parse the orderItems and 
      orderItems = req.body.orderItems;
      return Bluebird.all(_.map(orderItems, function(orderItem) {

        return OrderItem.objects.create({
          externalId: cartItem.product.externalId,
          externalPrice: cartItem.product.externalPrice,
          model: cartItem.product.model,
          name: cartItem.product.name,
          price: cartItem.product.price,
          product: cartItem.product.id,
          provider: cartItem.product.provider,
          photo: cartItem.photo.id,
          size: cartItem.product.size,
          order: order.id,
          user: user.id
        });

      }));

    }).then(function() {
      // now, fetch the cart items
      return CartItem.objects.find().where({ user: user.id, isArchived: false }).populate('product').populate('photo');
    }).then(function(models) {
      cartItems = models;

      // setup the orderObject and get the shipping rates
      if (!cartItems.length) return jsonErrorResponse(res, { message: 'You don\'t have any items in your cart.', status: 400 });

      orderObject.user = user.id;

      // grab shipping address
      orderObject.shippingFirstName = req.body.shippingFirstName;
      orderObject.shippingLastName = req.body.shippingLastName;
      orderObject.shippingAddress1 = req.body.shippingAddress1;
      if (req.body.shippingAddress2) orderObject.shippingAddress2 = req.body.shippingAddress2;
      orderObject.shippingCity = req.body.shippingCity;
      orderObject.shippingState = req.body.shippingState;
      orderObject.shippingZipCode = req.body.shippingZipCode;
      orderObject.shippingCountry = req.body.shippingCountry;

      // grab billing address
      orderObject.billingFirstName = req.body.billingFirstName;
      orderObject.billingLastName = req.body.billingLastName;
      orderObject.billingAddress1 = req.body.billingAddress1;
      if (req.body.billingAddress2) orderObject.billingAddress2 = req.body.billingAddress2;
      orderObject.billingCity = req.body.billingCity;
      orderObject.billingState = req.body.billingState;
      orderObject.billingZipCode = req.body.billingZipCode;
      orderObject.billingCountry = req.body.billingCountry;

      orderObject.shippingMethod = req.body.shippingMethod;

      // start adding up totals
      orderObject.subtotal = _.reduce(cartItems, function(memo, cartItem) {
        return memo + cartItem.product.price;
      }, 0.0);

      // add taxes
      if (_.has(config.TAXABLE_STATES, orderObject.shippingState)) {
        orderObject.tax = orderObject.subtotal * config.TAXABLE_STATES[orderObject.shippingState];
      }

      // fetch the shipping rates from Printful
      return user.calculateShippingRates({
        countryCode: orderObject.shippingCountry,
        stateCode: orderObject.shippingState,
        zipCode: orderObject.shippingZipCode
      }, cartItems);
    }).then(function(rates) {
      var shippingMethods = _.pluck(rates, 'id');

      // validate shipping rates
      if (!_.contains(shippingMethods, orderObject.shippingMethod)) {
        jsonErrorResponse(res, { message: 'Invalid shipping method.', status: 400 });
        return Bluebird.reject('Invalid shipping method.');
      }

      // update more totals
      orderObject.shipping = parseFloat(_.findWhere(rates, { id: orderObject.shippingMethod }).rate);
      orderObject.total = Order.prototype.calculateTotal({
        shipping: orderObject.shipping,
        subtotal: orderObject.subtotal
      }, orderObject.shippingState);

      // if there's a promo code, apply it now
      if (promoCode) {
        return Order.prototype.createWithPromoCode(orderObject, promoCode, user);
      } else {
        return Order.prototype.createOrder(user, orderObject);
      }
    }).then(function(order) {
      // create order items for all cart items
      userOrder = order;

      return Bluebird.all(_.map(cartItems, function(cartItem) {

        return OrderItem.objects.create({
          externalId: cartItem.product.externalId,
          externalPrice: cartItem.product.externalPrice,
          model: cartItem.product.model,
          name: cartItem.product.name,
          price: cartItem.product.price,
          product: cartItem.product.id,
          provider: cartItem.product.provider,
          photo: cartItem.photo.id,
          size: cartItem.product.size,
          order: order.id,
          user: user.id
        });

      }));

    }).then(function() {
      // process the payment
      return Order.prototype.processPayment({
        order: userOrder,
        creditCard: userCard,
        user: user
      });
    }).then(function() {
      // archive the users cart
      return CartItem.objects.update({ user: user.id, isArchived: false }, { isArchived: true, order: userOrder.id });
    }).then(function() {
      // fetch the order
      return Order.objects.findOne({ id: userOrder.id }).populate('orderItems').populate('promoCode').populate('user');
    }).then(function(completedOrder) {
      // send it off to printful
      completedOrder.sendToPrintful();

      // fetch all the order items
      return [completedOrder, OrderItem.objects.find().where({ order: completedOrder.id }).populate('photo')];
    }).spread(function(completedOrder, completedOrderItems) {
      // shoot off a confirmation email
      OrderMailer.sendOrderCompletedEmail(completedOrder, user);

      // send back ALL THE JSON!
      completedOrder = completedOrder.toJSON();
      completedOrder.orderItems = _.map(completedOrderItems, function(model) { return model.toJSON(); });
      res.status(200).json(completedOrder);
    }).catch(function(err) {
      var errorMessage = 'There was an error creating your order. Please contact support@printify.io if this problem persists.';

      console.trace(err);

      if (_.has(err, 'errorCode') && err.errorCode === 'transaction_failed') {
        Order.objects.update({ id: userOrder.id }, { status: 'failed', statusNotes: err.message }).then(function() {
          bugsnag.notify(new Error(err.message), { errorName: 'ControllerError:Cart' });
          jsonErrorResponse(res, { message: err.message, status: 400 });
        });
      } else if (userOrder) {
        Order.objects.update({ id: userOrder.id }, { status: 'failed', statusNotes: 'Failed to create order.' }).then(function() {
          bugsnag.notify(new Error(err.message || errorMessage), { errorName: 'ControllerError:Order' });

          if (_.has(err, 'message') && _.has(err, 'status')) {
            jsonErrorResponse(res, { message: err.message, status: err.status });
          } else {  
            jsonErrorResponse(res, { message: errorMessage, status: 400 });
          }
        });
      } else {
        if (_.has(err, 'message') && _.has(err, 'status')) {
          jsonErrorResponse(res, { message: err.message, status: err.status });
        } else {  
          jsonErrorResponse(res, { message: errorMessage, status: 400 });
        }
      }
    });
  }

};

module.exports = OrderController;
