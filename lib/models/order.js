/**
 * Order Model
 *
 * A purchase order record, includes a collection of OrderItems.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    Bluebird = require('bluebird'),
    braintree = require('braintree'),
    bugsnag = require('bugsnag'),
    paymentGateway = require('../utils/paymentGateway'),
    moment = require('moment'),
    Printful = require('../utils/printful'),
    printfulClient = new Printful(config.PRINTFUL_KEY),

    Transaction = require('./transaction'),
    OrderItem = require('./orderItem'),
    
    OrderMailer = require('../mailers/order');

/* Attributes (fields on the model) */
var Attributes = {

  externalId: {
    defaultsTo: null,
    type: 'integer'
  },

  shippingAddress1: {
    required: true,
    type: 'string'
  },

  shippingAddress2: {
    defaultsTo: '',
    type: 'string'
  },

  shippingCity: {
    required: true,
    type: 'string'
  },

  shippingState: {
    required: true,
    type: 'string'
  },

  shippingZipCode: {
    required: true,
    type: 'string'
  },

  shippingFirstName: {
    required: true,
    type: 'string'
  },

  shippingLastName: {
    required: true,
    type: 'string'
  },

  shippingCountry: {
    required: true,
    type: 'string'
  },

  billingAddress1: {
    required: true,
    type: 'string'
  },

  billingAddress2: {
    defaultsTo: '',
    type: 'string'
  },

  billingCity: {
    required: true,
    type: 'string'
  },

  billingState: {
    required: true,
    type: 'string'
  },

  billingZipCode: {
    required: true,
    type: 'string'
  },

  billingFirstName: {
    required: true,
    type: 'string'
  },

  billingLastName: {
    required: true,
    type: 'string'
  },

  billingCountry: {
    required: true,
    type: 'string'
  },

  paymentCardType: {
    required: true,
    type: 'string'
  },

  paymentLast4: {
    required: true,
    type: 'string'
  },

  paymentExpirationDate: {
    required: true,
    type: 'string'
  },

  paymentBraintreeToken: {
    required: true,
    type: 'string'
  },

  discount: {
    defaultsTo: 0,
    type: 'float'
  },

  discountType: {
    defaultsTo: null,
    type: 'string'
  },

  promoCode: {
    defaultsTo: null,
    model: 'promocode'
  },

  orderItems: {
    collection: 'orderitem',
    via: 'order'
  },

  shippingMethod: {
    required: true,
    type: 'string'
  },

  // created, draft, pending, failed, canceled, inprocess, onhold, partial, fulfilled
  status: {
    defaultsTo: 'created',
    type: 'string'
  },

  statusNotes: {
    defaultsTo: null,
    type: 'text'
  },

  shipping: {
    required: true,
    type: 'float'
  },

  tax: {
    defaultsTo: 0.0,
    type: 'float'
  },

  transaction: {
    defaultsTo: null,
    model: 'transaction'
  },

  subtotal: {
    required: true,
    type: 'float'
  },

  total: {
    required: true,
    type: 'float'
  },

  user: {
    model: 'user',
    required: true
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  sendShipmentNotification: function() {
    var _this = this;

    if (_.isObject(this.user)) {
      OrderMailer.sendOrderShippedEmail(this, this.user);
    } else {
      User.objects.findOne({ id: this.user }).then(function(user) {
        OrderMailer.sendOrderShippedEmail(_this, user);
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ModelError:Order' });
      });
    }
  },

  sendToPrintful: function() {
    var reqBody = {},
        _this = this;

    OrderItem.objects.find({ order: _this.id }).populate('photo').then(function(orderItems) {

      reqBody.external_id = _this.id;
      reqBody.shipping = _this.shippingMethod;
      reqBody.recipient = {
        name: _this.shippingFirstName + ' ' + _this.shippingLastName,
        address1: _this.shippingAddress1,
        address2: _this.shippingAddress2,
        city: _this.shippingCity,
        state_code: _this.shippingState,
        zip: _this.shippingZipCode,
        country_code: _this.shippingCountry,
        email: _this.user.email
      };

      reqBody.items = [];

      _.each(orderItems, function(orderItem) {
        reqBody.items.push({
          external_id: orderItem.id,
          variant_id: orderItem.externalId,
          quantity: 1,
          retail_price: orderItem.price + '',
          name: orderItem.size + ' ' + orderItem.getFormattedModel(),
          files: [{
            url: orderItem.photo.getFullUrl()
          }]
        });
      });

      reqBody.retail_costs = {
        tax: _this.tax
      };

      if (_this.discount) {
        var subtotal = _.reduce(orderItems, function(memo, orderItem) {
          return memo + orderItem.price;
        }, 0.0);
        if (_this.discountType === 'percent') reqBody.retail_costs.discount = subtotal * (_this.discount / 100);
        if (_this.discountType === 'flat') reqBody.retail_costs.discount = order.discount;
      }

      printfulClient.post('orders', reqBody)
        .success(function(resp) {
          // update the order status
          Order.objects.update({ id: _this.id }, { status: 'draft', externalId: resp.id }).catch(function(err) {
            console.trace(err);
            bugsnag.notify(new Error(err), { errorName: 'ModelError:Order' });
          });
        }).error(function(err) {
          console.trace(err);
          bugsnag.notify(new Error(err), { errorName: 'ModelError:Order' });
        });

    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ModelError:Order' });
    });
  },

  getEncodedId: function() {
    return new Buffer(this.paddedOrderId()).toString('base64');
  },

  paddedOrderId: function() {
    var s = this.id + '';
    while (s.length < 6) s = '0' + s;
    return s;
  },

  getFormattedTotal: function() {
    return '$' + parseFloat(this.total).toFixed(2);
  },

  getFullShippingAddress: function() {
    return this.shippingAddress2 ? this.shippingAddress1 + ' ' + this.shippingAddress2 : this.shippingAddress1; 
  },

  getFullBillingAddress: function() {
    return this.billingAddress2 ? this.billingAddress1 + ' ' + this.billingAddress2 : this.billingAddress1; 
  },
 
  getOrderLink: function() {
    return config.domain + '/account/orders/' + this.getEncodedId();
  },

  getFormattedStatus: function() {
    switch (this.status) {
      case 'created':
      case 'canceled':
      case 'failed':
      case 'completed':
        return this.status.charAt(0).toUpperCase() + this.status.slice(1);
      case 'draft':
        return 'Order Being Processed';
      case 'pending':
        return 'Waiting For Fulfillment';
      case 'inprocess':
        return 'Fulfillment In Process';
      case 'onhold':
        return 'On Hold';
      case 'partial':
        return 'Partially Shipped';
      case 'fulfilled':
        return 'Fulfilled and Shipped';
    }
  },

  getFormattedCreatedAt: function() {
    return moment(this.createdAt).format('MMMM Do, YYYY');
  },

  getFormattedUpdatedAt: function() {
    return moment(this.updatedAt).format('MMMM Do, YYYY');
  },

  toJSON: function() {
    var obj = _.clone(this.toObject());

    delete obj.externalId;
    delete obj.transaction;
    delete obj.paymentBraintreeToken;

    obj.id = this.getEncodedId();
    obj.formattedStatus = this.getFormattedStatus();
    obj.formattedCreatedAt = this.getFormattedCreatedAt();
    obj.formattedUpdatedAt = this.getFormattedUpdatedAt();
    obj.formattedTotal = this.getFormattedTotal();

    obj.orderItems = _.map(this.orderItems, function(oi) { return typeof oi === 'object' ? oi.toJSON() : oi; });
    if (this.promoCode !== null && typeof this.promoCode === 'object') obj.promoCode = this.promoCode.code;

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var Order = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'order',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes),

  calculateTotal: function(costs, shippingState) {
    var total = parseFloat(costs.shipping) + parseFloat(costs.subtotal);

    if (_.has(config.TAXABLE_STATES, shippingState)) total += parseFloat(costs.subtotal) * parseFloat(config.TAXABLE_STATES[shippingState]);

    total = parseFloat(parseFloat(total).toFixed(2));

    return total;
  },

  createOrder: function(user, orderObject) {
    var order;

    return Order.objects.create(orderObject).then(function(created) {
      return created;
    }).catch(function(err, errorCode) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ModelError:Order' });
    });
  },

  processPayment: function(opts) {
    var order = opts.order,
        creditCard = opts.creditCard,
        user = opts.user;

    return new Bluebird(function(resolve, reject) {

      // attempt to charge user first
      paymentGateway.transaction.sale({
        paymentMethodToken: creditCard.braintreeToken,
        amount: parseFloat(order.total).toFixed(2),
        options: {
          submitForSettlement: true
        }
      }, function(err, result) {
        if (err) return reject({ message: 'There was an error while attempting to charge card.', errorCode: 'transaction_failed' });
        if (!result.success) {
          if (_.has(result, 'transaction')) {
            reject({ message: 'Error processing payment: ' + result.transaction.status, errorCode: 'transaction_failed' });
          } else {
            var errorMessages = [];

            _.each(result.errors.deepErrors(), function (error) { errorMessages.push(error.message); });

            reject({
              message: 'Oops! The followed validation error(s) occured while trying to proccess your payment: ' + errorMessages.join(', ') + '.',
              errorCode: 'transaction_failed'
            });
          }
        }

        resolve(result.transaction);
      });

    }).then(function(processorTransaction) {

      return Transaction.objects.create({
        order: order.id,
        processorId: processorTransaction.id,
        status: processorTransaction.status,
        statusCode: processorTransaction.processorResponseCode || null,
        statusNotes: processorTransaction.processorResponseText || null,
        total: order.total,
        user: user.id
      });

    }).then(function(transaction) {
      return Order.objects.update({ id: order.id }, { transaction: transaction.id });
    });
  },

  createWithPromoCode: function(orderObject, promoCode, user) {
    var PromoCode = require('./promoCode'),
        _this = this;

    return PromoCode.objects.findOne({ code: promoCode }).then(function(promo) {
      if (!promo) return Bluebird.reject({ message: 'The given coupon code is not valid.', status: 400 });

      if (promo.isValid()) {
        orderObject.subtotal = promo.applyDiscount(orderObject.subtotal);

        // recalculate the total
        orderObject.total = Order.prototype.calculateTotal({
          shipping: orderObject.shipping,
          subtotal: orderObject.subtotal
        }, orderObject.shippingState);

        orderObject.promoCode = promo.id;
        orderObject.discount = promo.discount;
        orderObject.discountType = promo.discountType;

        if (promo.usesRemaining > 0) {
          return PromoCode.objects.update({ id: promo.id }, {
            usesRemaining: promo.usesRemaining - 1
          });
        } else {
          return true;
        }
      } else {
        return Bluebird.reject({ message: 'The given coupon code is expired or has already been used.', status: 400 });
      }
    }).then(function() {
      return Order.prototype.createOrder(user, orderObject);
    });
  }

}, LifecycleCallbacks));

module.exports = Order;