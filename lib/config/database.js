var config = require('./env'),
    Waterline = require('waterline'),
    orm = new Waterline(),
    mysqlAdapter = require('sails-mysql');

module.exports = function(done) {

  // waterline config
  var dbConfig = {

    adapters: {
      'default': config.database.defaultAdapter,
      mysql: mysqlAdapter
    },

    connections: {

      localMysql: {
        adapter: 'mysql',
        host: config.database.host,
        database: config.database.database,
        user: config.database.user,
        password: config.database.password,
        port: config.database.port,
        pool: config.database.pool,
        ssl: config.database.ssl
      }
    },

    defaults: {
      migrate: 'safe'
    }

  };

  // load models
  var Address = require('../models/address'),
      CartItem = require('../models/cartItem'),
      CreditCard = require('../models/creditCard'),
      MarketplaceCollection = require('../models/marketplaceCollection'),
      MarketplaceProduct = require('../models/marketplaceProduct'),
      Order = require('../models/order'),
      OrderItem = require('../models/orderItem'),
      Photo = require('../models/photo'),
      Product = require('../models/product'),
      PromoCode = require('../models/promoCode'),
      Shipment = require('../models/shipment'),
      Transaction = require('../models/transaction'),
      User = require('../models/user'),
      UserSettings = require('../models/userSettings'),
      Variation = require('../models/variation');

  orm.loadCollection(Address);
  orm.loadCollection(CartItem);
  orm.loadCollection(CreditCard);
  orm.loadCollection(MarketplaceCollection);
  orm.loadCollection(MarketplaceProduct);
  orm.loadCollection(Order);
  orm.loadCollection(OrderItem);
  orm.loadCollection(Photo);
  orm.loadCollection(Product);
  orm.loadCollection(PromoCode);
  orm.loadCollection(Shipment);
  orm.loadCollection(Transaction);
  orm.loadCollection(User);
  orm.loadCollection(UserSettings);
  orm.loadCollection(Variation);

  // initalize the orm
  orm.initialize(dbConfig, function(err, models) {
    if (err) throw err;

    Address.objects = models.collections.address;
    CartItem.objects = models.collections.cartitem;
    CreditCard.objects = models.collections.creditcard;
    MarketplaceCollection.objects = models.collections.marketplacecollection;
    MarketplaceProduct.objects = models.collections.marketplaceproduct;
    Order.objects = models.collections.order;
    OrderItem.objects = models.collections.orderitem;
    Photo.objects = models.collections.photo;
    Product.objects = models.collections.product;
    PromoCode.objects = models.collections.promocode;
    Shipment.objects = models.collections.shipment;
    Transaction.objects = models.collections.transaction;
    User.objects = models.collections.user;
    UserSettings.objects = models.collections.usersettings;
    Variation.objects = models.collections.variation;

    done(models);
  });

};