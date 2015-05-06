var Backbone = require('backbone'),
    $ = require('jquery'),
    _ = require('lodash'),
    Globals = require('./globals'),
    App = Globals.App,

    // Views
    AboutPageView = require('./views/pages/about'),
    CartView = require('./views/account/cart'),
    CheckoutView = require('./views/account/checkout'),
    CreatePrintView = require('./views/products/createPrint'),
    ErrorPageView = require('./views/pages/error'),
    FooterView = require('./views/components/footer'),
    HomePageView = require('./views/pages/home'),
    MarketplaceView = require('./views/marketplace'),
    MarketplaceProductView = require('./views/marketplace/singleProduct'),
    OrderView = require('./views/account/orderHistory/singleOrder'),
    OrderHistoryView = require('./views/account/orderHistory'),
    PrivacyPolicyView = require('./views/pages/privacyPolicy'),
    ProductsPageView = require('./views/products/products'),
    ProductPageView = require('./views/products/product'),
    ReturnsView = require('./views/pages/returns'),
    ShippingView = require('./views/pages/shipping'),
    TermsOfServiceView = require('./views/pages/termsOfService'),
    TopbarView = require('./views/components/topbar/topbar');

require('./models/user');

var Router = Backbone.Router.extend({

  routes: {
    // Home
    '': 'homeRoute',
    '/': 'homeRoute',

    // About
    'about': 'aboutRoute',
    'about/': 'aboutRoute',

    // Accounts
    'account/cart': 'cartRoute',
    'account/cart/': 'cartRoute',
    'account/checkout': 'checkoutRoute',
    'account/checkout/': 'checkoutRoute',
    'account/orders': 'ordersRoute',
    'account/orders/': 'ordersRoute',
    'account/orders/:id': 'orderRoute',
    'account/orders/:id/': 'orderRoute',

    // Marketplace
    'marketplace': 'marketplaceRoute',
    'marketplace/': 'marketplaceRoute',
    'marketplace/:slug': 'marketplaceProductRoute',
    'marketplace/:slug/': 'marketplaceProductRoute',

    // Products
    'products': 'productsRoute',
    'products/': 'productsRoute',
    'products/:slug': 'productRoute',
    'products/:slug/': 'productRoute',
    'products/:slug/:size': 'productRoute',
    'products/:slug/:size/': 'productRoute',
    'products/:slug/:size/create': 'createPrintRoute',
    'products/:slug/:size/create/': 'createPrintRoute',

    // error
    'error': 'errorRoute',
    'error/(:errorPage)': 'errorRoute',
    'error/(:errorPage/)': 'errorRoute',

    // Pages
    'terms-of-service': 'termsOfServiceRoute',
    'terms-of-service/': 'termsOfServiceRoute',
    'privacy-policy': 'privacyPolicyRoute',
    'privacy-policy/': 'privacyPolicyRoute',
    'returns': 'returnsRoute',
    'returns/': 'returnsRoute',
    'shipping': 'shippingRoute',
    'shipping/': 'shippingRoute',

    ':frag': 'catchAll',
    ':frag/': 'catchAll',
    ':frag/:fragTwo': 'catchAll',
    ':frag/:fragTwo/': 'catchAll'
  },

  initialize: function() {
    this.htmlClasses = $('html').attr('class');
    this.contentClasses = $(Globals.CONTENT_ELEMENT).attr('class');

    this.topBar = new TopbarView({ router: this });
    this.footerView = new FooterView({ router: this });

    this.defaultMetaDescription = 'The fastest way to order beautiful prints of your photos and graphics. ' +
                                  'No hassle, high quality canvas prints, posters, and framed posters.';

    this.bindEvents();
  },

  bindEvents: function() {
    this.listenTo(App.events, 'session:signOut', _.bind(this.authenticate, this));
    this.listenTo(App.state, 'change:loading', function() {
      if (App.state.get('loading')) {
        $('body').addClass('is-loading');
      } else {
        if (App.state.get('initialLoad')) {
          $('body').addClass('fade-out');
          _.delay(function() {
            $('body').removeClass('initializing fade-out is-loading');
          }, 1000);
          App.state.set('initialLoad', false);
        } else {
          $('body').removeClass('is-loading');
        }
      }
    });
    this.listenTo(App.state, 'change:title', function() { $('title').text(App.state.get('title')); });
    this.listenTo(App.state, 'change:metaDescription', function() { $('meta[name="description"]').attr('content', App.state.get('metaDescription')); });
  },

  // Called before the route function
  before: function() {
    // clean up old view
    if (typeof this.currentView !== 'undefined') {
      this.currentView.close();
      delete this.currentView;
    }

    // reset class on html element
    $('html').attr('class', this.htmlClasses);

    // reset body classes
    $(Globals.CONTENT_ELEMENT).attr('class', this.contentClasses);

    // set loading
    App.state.set('loading', true);
  },

  // Called after the route function
  after: function() {
    $(window).scrollTop(0);
  },

  authenticate: function() {
    // Authenticate is called after 'before' and if it returns false, the callstack ends.
    var allowed = true;

    // Pages users can view while logged out
    var restrictedFragments = [
      // new RegExp('^404'),
      new RegExp(/^account\/\w+/)
    ];
    
    _.each(restrictedFragments, function(re) {
      if (re.test(Backbone.history.fragment)) { allowed = false; }
    });

    // redirect users who are not authenticated when the fragment is not allowed
    if (!App.session.isSignedIn() && !allowed) {
      this.navigate('browse', { trigger: true, replace: true });
      return false;
    }

    return true;
  },

  authorize: function() {
    return true;
  },

  catchAll: function() {
    this.navigate('/', { trigger: true, replace: true });
  },

  aboutRoute: function() {
    this.currentView = new AboutPageView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'About | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  cartRoute: function() {
    this.currentView = new CartView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'Cart | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  checkoutRoute: function() {
    this.currentView = new CheckoutView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'Checkout | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },  

  createPrintRoute: function(slug, size) {
    var products = App.persist.get('products');

    products = products.where({ slug: slug, size: size });

    if (!products.length) { this.navigate('error/404', { trigger: true, replace: true }); return; }

    this.currentView = new CreatePrintView({
      product: _.first(products),
      router: this,
      size: size,
      slug: slug
    });
    analytics.page();
    App.state.set('title', 'Create Print | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  errorRoute: function(errorPage) {
    errorPage = errorPage ? errorPage : '404';
    this.currentView = new ErrorPageView({
      errorPage: errorPage,
      router: this
    });
    analytics.page();
    App.state.set('title', 'Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  homeRoute: function() {
    this.currentView = new HomePageView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  marketplaceRoute: function() {
    this.currentView = new MarketplaceView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'Custom Canvas Print and Framed Poster Marketplace | Printify.io');
    App.state.set('metaDescription', 'Customer High quality canvas print, poster, and framed poster designs ready for your wall.');
  },

  marketplaceProductRoute: function(slug) {
    var marketplaceProducts = App.persist.get('marketplace'),
        product;

    product = marketplaceProducts.find(function(model) { return model.get('slug') === slug; });

    if (!product) { this.navigate('error/404', { trigger: true, replace: true }); return; }

    this.currentView = new MarketplaceProductView({
      model: product,
      router: this,
      slug: slug
    });
    analytics.page();
    App.state.set('title', 'Custom Canvas Print and Framed Poster Marketplace | Printify.io');
    App.state.set('metaDescription', 'Customer High quality canvas print, poster, and framed poster designs ready for your wall.');
  },

  orderRoute: function(orderId) {
    this.currentView = new OrderView({
      id: orderId,
      router: this
    });
    analytics.page();
    App.state.set('title', 'Order #' + orderId + ' | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  ordersRoute: function() {
    this.currentView = new OrderHistoryView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'Order History | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  productsRoute: function() {
    this.currentView = new ProductsPageView({
      router: this
    });
    analytics.page();
    App.state.set('title', 'Canvas Prints and Posters | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', 'High quality custom canvas prints, posters, and framed posters that will add personality to any room.');
  },

  productRoute: function(slug, size) {
    var products = App.persist.get('products');
    if (!size || _.isObject(size)) size = false;

    if (size) products = products.where({ slug: slug, size: size });
    else products = products.where({ slug: slug });

    if (!products.length) { this.navigate('error/404', { trigger: true, replace: true }); return; }
    if (size && !products.length) { this.navigate('error/404', { trigger: true, replace: true }); return; }

    this.currentView = new ProductPageView({
      router: this,
      size: size,
      slug: slug
    });
    analytics.page();
    App.state.set('title', _.first(products).get('formattedModel') + 's | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  termsOfServiceRoute: function() {
    this.currentView = new TermsOfServiceView({ router: this });
    analytics.page();
    App.state.set('title', 'Terms of Service | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  privacyPolicyRoute: function() {
    this.currentView = new PrivacyPolicyView({ router: this });
    analytics.page();
    App.state.set('title', 'Privacy Policy | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  returnsRoute: function() {
    this.currentView = new ReturnsView({ router: this });
    analytics.page();
    App.state.set('title', 'Returns | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  },

  shippingRoute: function() {
    this.currentView = new ShippingView({ router: this });
    analytics.page();
    App.state.set('title', 'Shipping | Printify.io – Your moments, printed.');
    App.state.set('metaDescription', this.defaultMetaDescription);
  }

});

module.exports = Router;