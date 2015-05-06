// Fetches products from Printful and loads them in to the database.

var config = require('./lib/config/env'),
    _ = require('lodash'),
    Backbone = require('Backbone'),
    Helpers = require('./lib/helpers'),

    // Models
    Address = require('./lib/models/address'),
    CartItem = require('./lib/models/cartItem'),
    CreditCard = require('./lib/models/creditCard'),
    Order = require('./lib/models/order'),
    OrderItem = require('./lib/models/orderItem'),
    Photo = require('./lib/models/photo'),
    Product = require('./lib/models/product'),
    PromoCode = require('./lib/models/promoCode'),
    Shipment = require('./lib/models/shipment'),
    Transaction = require('./lib/models/transaction'),
    User = require('./lib/models/user'),
    UserSettings = require('./lib/models/userSettings');

var Console = function() {
  this.initialize.apply(this, arguments);
};


Console.prototype = {

  initialize: function() {
    // load in the database then fetch the products
    require('./lib/config/database')(_.bind(this.onReady, this));
  },

  onReady: function() {
    var repl = require('repl'),
        console;

    console = repl.start({
      prompt: "printify.io> ",
      input: process.stdin,
      output: process.stdout
    });

    // Expose Models
    _.extend(console.context, {
      Address: Address,
      CartItem: CartItem,
      CreditCard: CreditCard,
      Order: Order,
      OrderItem: OrderItem,
      Photo: Photo,
      Product: Product,
      PromoCode: PromoCode,
      Shipment: Shipment,
      Transaction: Transaction,
      User: User,
      UserSettings: UserSettings,
    });
  }

};

new Console();