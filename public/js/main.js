var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('./app/globals'),
    App = Globals.App,
    Braintree = require('braintree-web');

// fixes an 'undefined is not a function' error
Backbone.$ = $;

// require vendor modules
require('./vendor/backbone.queryparams');
require('./vendor/backbone.queryparams-shim');
require('./vendor/jquery.cookie');
require('./vendor/jquery.csrf');
require('./vendor/sweet-alert');
require('./vendor/jquery.showoff');
require('./vendor/jquery.jcrop');
require('./vendor/jquery.payment');
require('./vendor/floatlabel');

// require lib modules
require('./lib/backbone.dinghy');

// Setup some libraries on the window
window.Dropzone = require('./vendor/dropzone');
window.Backbone = Backbone;
window._ = _;
window.$ = window.jQuery = $;

// define our app
var Initializer = function() {
  this.initialize.apply(this, arguments);
};

Initializer.prototype = {

  initialize: function() {
    var SessionController = require('./app/controllers/session'),
        AnalyticsController = require('./app/controllers/analytics');

    $('body').addClass('is-loading initializing');

    App.Braintree = Braintree;
    
    // create a main event dispatcher
    App.events = _.clone(Backbone.Events);
    window.onscroll = function(e) { App.events.trigger('window:onScroll', e); };

    // create "cache" and init a few values
    App.persist = new (Backbone.Model.extend({}))(); // persistent across sessions
    App.cache = new (Backbone.Model.extend({}))(); // clears on login/logout

    // create a state manager for the app and set some defaults
    App.state = new (Backbone.Model.extend({}))();
    App.state.set({
      initialLoad: true,
      loading: true
    });

    App.session = new SessionController();
    App.analytics = new AnalyticsController();

    this.bootstrap(_.bind(this.startApp, this));
  },

  bootstrapMarketplace: function(done) {
    var _this = this,
        MarketplaceProducts = require('./app/collections/marketplaceProducts'),
        products = new MarketplaceProducts(),
        req;

    App.persist.set('marketplace', products);

    req = products.fetch();
    req.done(done);
    req.fail(function() {
      console.log('bootstrapMarketplace failed.'); // TODO
    });

    return req;
  },

  bootstrapProducts: function(done) {
    var _this = this,
        Products = require('./app/collections/products'),
        products = new Products(),
        req;

    App.persist.set('products', products);

    req = products.fetch();
    req.done(done);
    req.fail(function() {
      console.log('bootstrapProducts failed.'); // TODO
    });

    return req;
  },

  bootstrapSession: function(done) {
    var _this = this,
        req;

    req = App.session.initialFetch();

    req.always(done);

    return req;
  },

  bootstrap: function(done) {
    var BOOTSTRAP_REQS = 3,
        next = _.after(BOOTSTRAP_REQS, done),
        _this = this,
        req;

    this.bootstrapProducts(next);
    this.bootstrapSession(next);
    this.bootstrapMarketplace(next);
  },

  startApp: function() {
    var Router = require('./app/router');
    
    this.router = new Router();
    
    Backbone.history.start({ pushState: true });

    // window.App = App; // ONLY USE FOR DEV
    App.router = this.router;
  }

};

// start it up!
new Initializer();