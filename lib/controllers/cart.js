var Helpers = require('../helpers'),
    passport = require('passport'),
    config = require('../config/env'),
    _ = require('lodash'),
    Printful = require('../utils/printful'),
    Bluebird = require('bluebird'),
    bugsnag = require('bugsnag'),

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
    User = require('../models/user'),

    // Resources
    CartResource = require('../api/resources/cart');

var getResource = function(req, res) {
  return new CartResource({
    req: req,
    res: res
  });
};

var CartController = {

  // Returns a list of a user's cartItems
  getList: function(req, res) {
    var resource = getResource(req, res);

    resource.getList().then(function(cartItems) {
      res.status(200).json(_.map(cartItems, function(cartItem) { return cartItem.toJSON(); }));
    });
  },

  // Returns a single cartItem
  getDetail: function(req, res) {
    var resource = getResource(req, res);

    resource.getDetail().then(function(cartItem) {
      res.status(200).json(cartItem.toJSON());
    });
  },

  // Create a cartItem
  post: function(req, res) {
    var resource = getResource(req, res);

    resource.post().then(function(cartItem) {
      res.status(200).json(cartItem.toJSON());
    });
  },

  // Edits a cartItem
  put: function(req, res) {
    var resource = getResource(req, res);

    resource.put().then(function(cartItem) {
      res.status(200).json(cartItem.toJSON());
    });
  },

  delete: function(req, res) {
    var resource = getResource(req, res);
    resource.delete();
  },

  shippingRates: function(req, res) {
    var printfulClient = new Printful(config.PRINTFUL_KEY),
        requestBody = {
          recipient: {},
          items: []
        },
        _this = this,
        user = req.user;

    if (!req.body.country) return jsonErrorResponse(res, { message: 'You must specify a country code.', status: 400 });
    if (!req.body.state) return jsonErrorResponse(res, { message: 'You must specify a state.', status: 400 });
    if (!req.body.zipCode) return jsonErrorResponse(res, { message: 'You must specify a zip code.', status: 400 });

    CartItem.objects.find().where({ user: user.id, isArchived: false }).populate('product').then(function(cartItems) {
      if (!cartItems.length) {
        res.status(200).json({
          total: 0,
          shipping: 0,
          subtotal: 0
        });
      }
      
      return user.calculateShippingRates({
        countryCode: req.body.country,
        stateCode: req.body.state,
        zipCode: req.body.zipCode
      }, cartItems);
    }).then(function(rates) {
      res.status(200).json(rates);
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ControllerError:Cart' });
      jsonErrorResponse(res);
    });
  },

  checkPromoCode: function(req, res) {
    var user = req.user,
        promoCode = req.body.promoCode;

    if (!promoCode) return jsonErrorResponse(res, { message: 'Please supply a promoCode you want to check.', status: 400 });

    PromoCode.objects.findOne({ code: promoCode }).then(function(promo) {
      if (!promo) return jsonErrorResponse(res, { message: 'Sorry, it looks like that promo code does not exist.', status: 404 });
      if (!promo.isValid()) return jsonErrorResponse(res, { message: 'This promo code is expired or has already been used.', status: 400 });
      promoCode = promo;
      return CartItem.objects.find({ user: user.id, isArchived: false }).populate('product');
    }).then(function(cartItems) {
      return user.getCartSubtotal(cartItems);
    }).then(function(subtotal) {
      res.status(200).json({
        discountedSubtotal: promoCode.applyDiscount(subtotal),
        discount: promoCode.discount,
        discountType: promoCode.discountType
      });
    }).catch(function(err) {
      console.trace(err);
      jsonErrorResponse(res);
    });

  },

  checkout: function(req, res) {
    var user = req.user,
        _this = this,
        orderObject = {},
        cartItems = false,
        cardId = req.body.creditCard,
        promoCode = req.body.promoCode ? req.body.promoCode : false,
        userCard, userOrder;

    // validate request params
    var validator = new OrderValidator({ req: req, res: res }),
        isValid = validator.validateCheckout();
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

module.exports = CartController;
