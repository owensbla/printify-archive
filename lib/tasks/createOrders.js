// Fetches products from Printful and loads them in to the database.

var config = require('../config/env'),
    Printful = require('../utils/printful'),
    _ = require('lodash'),
    Task = require('./_baseTask'),
    Order = require('../models/order'),
    OrderItem = require('../models/orderItem'),
    Helpers = require('../helpers');

var CreateOrders = Task.extend({

  initialize: function() {
    this.printfulClient = new Printful(config.PRINTFUL_KEY);

    // load in the database then fetch the products
    require('../config/database')(_.bind(this.createOrders, this));
  },

  onError: function(err) {
    console.log(err);
  },

  onSuccess: function(resp) {
    var orderId = resp.external_id;

    Order.objects.update({ id: orderId }, { externalId: resp.id, status: 'draft' }).then(function(orders) {
      if (!orders.length) return console.log('Failed to update order #' + orderId);
      console.log('Updated order #' + orderId);
    });

    // update order items with line item id
    _.each(resp.items, function(pOrderItem) {
      OrderItem.objects.update({ id: pOrderItem.external_id }, { lineItemId: pOrderItem.id }).then(function(orderItems) {
        if (!orderItems.length) return console.log('Failed to update order item #' + pOrderItem.external_id);
        console.log('Updated order item #' + _.first(orderItems).id);
      });
    });
  },

  createOrders: function() {
    console.log('=========== Sending Orders to Printful ===========');
    
    var _this = this;

    Order.objects.find({ status: 'created' }).populate('user').then(function(orders) {
      _.each(orders, function(order) { order.sendToPrintful(); });
    });
  },

  createOrder: function(order) {
    console.log('Creating order #' + order.id);

    var reqBody = {},
        _this = this;

    OrderItem.objects.find({ order: order.id }).populate('photo').then(function(orderItems) {

      reqBody.external_id = order.id;
      reqBody.shipping = order.shippingMethod;
      reqBody.recipient = {
        name: order.shippingFirstName + ' ' + order.shippingLastName,
        address1: order.shippingAddress1,
        address2: order.shippingAddress2,
        city: order.shippingCity,
        state_code: order.shippingState,
        zip: order.shippingZipCode,
        country_code: order.shippingCountry,
        email: order.user.email
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
        tax: order.tax
      };

      if (order.discount) {
        var subtotal = _.reduce(orderItems, function(memo, orderItem) {
          return memo + orderItem.price;
        }, 0.0);
        if (order.discountType === 'percent') reqBody.retail_costs.discount = subtotal * (order.discount / 100);
        if (order.discountType === 'flat') reqBody.retail_costs.discount = order.discount;
      }

      _this.printfulClient.post('orders', reqBody).success(_.bind(_this.onSuccess, _this)).error(_this.onError);

    });

  },

});

new CreateOrders();