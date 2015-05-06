var express = require('express'),
    Globals = require('./globals'),
    Helpers = require('./helpers'),
    passport = require('passport'),

    // Auths
    Authentication = require('./api/authentication'),
    Authorization = require('./api/authorization'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized;

module.exports = function(app) {

  /*************************************
   ** APP ROUTES **
   *************************************/

   // Public
  var pageController = require('./controllers/pages');

  app.get('/', pageController.home);
  app.get('/ping', function(req, res) { res.status(200).end(); });
  app.get('/about', pageController.about);
  app.get('/marketplace', pageController.marketplace);
  app.get('/marketplace/:slug', pageController.marketplaceProduct);
  app.get('/products', pageController.products);
  app.get('/products/:slug', pageController.product);
  app.get('/products/:slug/:size', pageController.product);
  app.get('/products/:slug/:size/create', pageController.createProduct);
  app.get('/terms-of-service', pageController.termsOfService);
  app.get('/privacy-policy', pageController.privacyPolicy);
  app.get('/returns', pageController.returns);
  app.get('/shipping', pageController.shipping);
  app.get('/error', pageController.error);
  app.get('/error/:errorCode', pageController.error);

  // Authenticated User
  var authenticatedController = require('./controllers/authenticated');

  app.get('/account/cart', Authentication.isAuthenticated, authenticatedController.cart);
  app.get('/account/checkout', Authentication.isAuthenticated, authenticatedController.checkout);
  app.get('/account/orders', Authentication.isAuthenticated, authenticatedController.orders);
  app.get('/account/orders/:encodedId', Authentication.isAuthenticated, authenticatedController.order);

  // Admin

  var adminController = require('./controllers/admin'),
      adminMarketplaceController = require('./controllers/admin/marketplace');

  app.get('/a', Authentication.isAuthenticated, Authorization.isAdmin, adminController.home);
  app.get('/a/orders', Authentication.isAuthenticated, Authorization.isAdmin, adminController.orders);
  app.get('/a/marketplace/new', Authentication.isAuthenticated, Authorization.isAdmin, adminMarketplaceController.new);
  app.post('/a/marketplace/new', Authentication.isAuthenticated, Authorization.isAdmin, adminMarketplaceController.create);

  /*************************************
   ** API ROUTES **
   *************************************/

  // Address
  var addressController = require('./controllers/address'),
      addressApi = express.Router();

  addressApi.get('/', Authentication.isAuthenticatedApi, addressController.getList);
  addressApi.get('/:id', Authentication.isAuthenticatedApi, addressController.getDetail);
  addressApi.put('/:id', Authentication.isAuthenticatedApi, addressController.put);
  addressApi.post('/', Authentication.isAuthenticatedApi, addressController.post);
  addressApi.delete('/:id', Authentication.isAuthenticatedApi, addressController.delete);

  app.use(Helpers.apiPath('address'), addressApi);

  // Cart
  var cartController = require('./controllers/cart'),
      cartApi = express.Router();

  cartApi.get('/', Authentication.isAuthenticatedApi, cartController.getList);
  cartApi.get('/:id', Authentication.isAuthenticatedApi, cartController.getDetail);
  cartApi.post('/shipping', Authentication.isAuthenticatedApi, cartController.shippingRates);
  cartApi.post('/apply-promo', Authentication.isAuthenticatedApi, cartController.checkPromoCode);
  cartApi.post('/', Authentication.isAuthenticatedApi, cartController.post);
  cartApi.post('/checkout', Authentication.isAuthenticatedApi, cartController.checkout);
  cartApi.delete('/:id', Authentication.isAuthenticatedApi, cartController.delete);

  // cartApi.put('/:id', Authentication.isAuthenticatedApi, cartController.put);
  cartApi.put('/:id', notImplemented);

  app.use(Helpers.apiPath('cart'), cartApi);

  // CreditCard
  var ccController = require('./controllers/creditCard'),
      ccApi = express.Router();

  // ccApi.get('/', Authentication.isAuthenticatedApi, ccController.getList);
  // ccApi.get('/:id', Authentication.isAuthenticatedApi, ccController.getDetail);
  ccApi.post('/', Authentication.isAuthenticatedApi, ccController.post);
  // ccApi.delete('/:id', Authentication.isAuthenticatedApi, ccController.delete);

  ccApi.get('/', notImplemented);
  ccApi.get('/:id', notImplemented);
  ccApi.put('/:id', notImplemented);
  ccApi.delete('/:id', notImplemented);

  app.use(Helpers.apiPath('credit-card'), ccApi);

  // Marketplace
  var marketplaceController = require('./controllers/marketplace'),
      marketplaceApi = express.Router();

  marketplaceApi.get('/', marketplaceController.getList);
  // marketplaceApi.get('/collections', marketplaceController.getCollections);
  marketplaceApi.get('/:id', marketplaceController.getDetail);

  marketplaceApi.put('/:id', notImplemented);
  marketplaceApi.post('/', notImplemented);
  marketplaceApi.delete('/:id', notImplemented);

  app.use(Helpers.apiPath('marketplace'), marketplaceApi);

  // Orders
  var orderController = require('./controllers/order'),
      orderApi = express.Router();

  orderApi.get('/', Authentication.isAuthenticatedApi, orderController.getList);
  orderApi.get('/:encodedId', Authentication.isAuthenticatedApi, orderController.getDetail);

  orderApi.post('/', notImplemented);
  orderApi.put('/:id', notImplemented);
  orderApi.delete('/:id', notImplemented);

  app.use(Helpers.apiPath('order'), orderApi);

  // Photos
  var photoController = require('./controllers/photo'),
      photoApi = express.Router();

  photoApi.get('/', Authentication.isAuthenticatedApi, photoController.getList);
  photoApi.get('/:id', Authentication.isAuthenticatedApi, photoController.getDetail);
  photoApi.post('/', Authentication.isAuthenticatedApi, photoController.post);
  photoApi.post('/:id/crop', Authentication.isAuthenticatedApi, photoController.createCrop);
  photoApi.put('/:id', Authentication.isAuthenticatedApi, photoController.put);
  photoApi.delete('/:id', Authentication.isAuthenticatedApi, photoController.delete);

  app.use(Helpers.apiPath('photo'), photoApi);

  // Products
  var productController = require('./controllers/product'),
      productApi = express.Router();

  productApi.get('/', productController.getList);
  productApi.get('/:id', productController.getDetail);

  productApi.put('/:id', notImplemented);
  productApi.post('/', notImplemented);
  productApi.delete('/:id', notImplemented);

  app.use(Helpers.apiPath('product'), productApi);

  // Sessions
  var sessionController = require('./controllers/session'),
      sessionApi = express.Router();

  sessionApi.get('/', Authentication.isAuthenticatedApi, sessionController.get);
  sessionApi.post('/', passport.authenticate('local'), sessionController.login);
  sessionApi.delete('/', Authentication.isAuthenticatedApi, sessionController.logout);

  sessionApi.get('/', notImplemented);
  sessionApi.put('/', notImplemented);
  sessionApi.put('/:id', notImplemented);

  app.use(Helpers.apiPath('session'), sessionApi);

  // Users
  var userController = require('./controllers/user'),
      userApi = express.Router();

  userApi.get('/session', Authentication.isAuthenticatedApi, sessionController.get);
  userApi.get('/:id', Authentication.isAuthenticatedApi, userController.getDetail);
  userApi.get('/:id/activate/:token', userController.activate);
  userApi.put('/:id', Authentication.isAuthenticatedApi, userController.put);
  userApi.post('/signup', userController.signup);
  userApi.post('/login', sessionController.login);
  userApi.post('/logout', Authentication.isAuthenticatedApi, sessionController.logout);
  userApi.post('/forgot', userController.forgotPassword);
  userApi.post('/reset/:token', userController.resetPassword);

  userApi.get('/', notImplemented);
  userApi.post('/', notImplemented);
  userApi.delete('/', notImplemented);

  app.use(Helpers.apiPath('user'), userApi);

  // Uploads

  var uploadController = require('./controllers/upload'),
      uploadApi = express.Router();

  uploadApi.post('/', Authentication.isAuthenticatedApi, uploadController.signRequest);

  app.use(Helpers.apiPath('upload'), uploadApi);

};

