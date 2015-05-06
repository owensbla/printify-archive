// Fetches products from Printful and loads them in to the database.

var config = require('../config/env'),
    Printful = require('../utils/printful'),
    _ = require('lodash'),
    Task = require('./_baseTask'),
    Order = require('../models/order'),
    OrderItem = require('../models/orderItem'),
    Shipment = require('../models/shipment'),
    Helpers = require('../helpers');

var UpdateOrders = Task.extend({

  initialize: function() {
    this.printfulClient = new Printful(config.PRINTFUL_KEY);

    // load in the database then fetch the products
    require('../config/database')(_.bind(this.updateOrders, this));
  },

  onError: function(err) {
    console.log(err);
  },

  onSuccess: function(resp) {
    var orderId = parseInt(new Buffer(resp.external_id, 'base64').toString('ascii'));

    Order.objects.update({ id: orderId }, { externalId: resp.id, status: 'pending' }).then(function(orders) {
      if (!orders.length) return console.log('Failed to update order #' + orderId);
      console.log('Updated order #' + orderId);
    });
  },

  updateOrders: function() {
    console.log('=========== Updating Orders ===========');
    
    var _this = this;

    Order.objects.find({ status: ['draft', 'pending', 'inprocess', 'partial', 'onhold'] }).populate('user').then(function(orders) {
      _.each(orders, _.bind(_this.updateOrder, _this));
    });
  },

  updateOrder: function(order) {
    var reqBody = {},
        _this = this;

    this.printfulClient.get('orders/' + order.externalId).success(function(pOrder) {

      // check to see if the status has changed to a shipped state
      var shippedStatus = ['partial', 'fulfilled'];
      if (!_.contains(shippedStatus, order.status) && _.contains(shippedStatus, pOrder.status)) order.sendShipmentNotification();

      // update the order item
      Order.objects.update({ id: order.id }, {
        status: pOrder.status,
        updated: new Date()
      }).then(function() { console.log('Updated order #' + order.id); }).catch(function() { console.log('Failed to update order #' + order.id); });

      // update order items with no line id
      OrderItem.objects.find().where({ order: order.id, lineItemId: null }).then(function(orderItems) {
        _.each(orderItems, function(orderItem) {
          var pOrderItem = _.find(pOrder.items, function(p) { return parseInt(p.external_id) === orderItem.id; });
          if (!pOrderItem) return;

          OrderItem.objects.update(
            { id: orderItem.id },
            { lineItemId: pOrderItem.id }
          ).then(function() {}).catch(function(err) { console.log(err); });
        });

      }).catch(function(err) { console.log(err); });

      // create/update shipments for all order items
      _.each(pOrder.shipments, function(pShipment) {

        // find or create the shipment
        Shipment.objects.findOne({ externalId: pShipment.id }).then(function(shipment) {
          if (shipment) return shipment;
          return Shipment.objects.create({
            externalId: pShipment.id,
            carrier: pShipment.carrier,
            service: pShipment.service,
            trackingNumber: pShipment.tracking_number,
            trackingUrl: pShipment.tracking_url,
            shipDate: pShipment.ship_date,
            reshipment: pShipment.reshipment
          });
        }).then(function(shipment) {

          // now loop through all the shipment items
          _.each(pShipment.items, function(shipped) {

            // and update our order items
            OrderItem.objects.update({ lineItemId: shipped.item_id }, { shipment: shipment.id }).then(function(updated) {
              orderItem = _.first(updated);
              if (!orderItem) return console.log('Failed to update an order item for order #' + order.id);
              console.log('Updated order item #' + orderItem.id);
            }).catch(function() { console.log('Failed to update an order item for order #' + order.id); });

          });

        });

      });

    }).error(this.onError);

  },

});

new UpdateOrders();