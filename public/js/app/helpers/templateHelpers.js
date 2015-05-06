var Handlebars = require('hbsfy/runtime'),
    _ = require('lodash');

// Layout Templates
var LAYOUTS = {

  // Pages
  'layouts/pages/home': require('../../../../lib/templates/layouts/pages/home'),
  'layouts/pages/about': require('../../../../lib/templates/layouts/pages/about'),
  'layouts/pages/products': require('../../../../lib/templates/layouts/pages/products'),
  'layouts/pages/marketplace': require('../../../../lib/templates/layouts/pages/marketplace'),
  'layouts/pages/marketplaceProduct': require('../../../../lib/templates/layouts/pages/marketplaceProduct'),
  'layouts/pages/createPrint': require('../../../../lib/templates/layouts/pages/createPrint'),
  'layouts/pages/canvasPrints': require('../../../../lib/templates/layouts/pages/canvasPrints'),
  'layouts/pages/posters': require('../../../../lib/templates/layouts/pages/posters'),
  'layouts/pages/framedPosters': require('../../../../lib/templates/layouts/pages/framedPosters'),
  'layouts/pages/error': require('../../../../lib/templates/layouts/pages/error'),
  'layouts/pages/returns': require('../../../../lib/templates/layouts/pages/returns'),
  'layouts/pages/termsOfService': require('../../../../lib/templates/layouts/pages/termsOfService'),
  'layouts/pages/privacyPolicy': require('../../../../lib/templates/layouts/pages/privacyPolicy'),
  'layouts/pages/shipping': require('../../../../lib/templates/layouts/pages/shipping'),

  // Account Pages
  'layouts/account/cart': require('../../../../lib/templates/layouts/account/cart'),
  'layouts/account/checkout': require('../../../../lib/templates/layouts/account/checkout'),
  'layouts/account/orders': require('../../../../lib/templates/layouts/account/orders'),
  'layouts/account/singleOrder': require('../../../../lib/templates/layouts/account/singleOrder')

};

var TemplateHelpers = {

  /*
   * We need more control over the order of including partials because some are included in templates
   * and thus we need to register them as partials with Handlebars.
   */
  loadTemplates: function() {
    var Templates = {};

    _.extend(Templates, LAYOUTS);

    /*****************************/
    /***        Partials       ***/
    /*****************************/

    // Uploads
    Templates['partials/upload/uploadForm'] = require('../../../../lib/templates/partials/upload/uploadForm');
    Handlebars.registerPartial('upload/uploadForm', Templates['partials/upload/uploadForm']);

    // Create Product
    Templates['partials/product/createProduct/upload'] = require('../../../../lib/templates/partials/product/createProduct/upload');
    Handlebars.registerPartial('product/createProduct/upload', Templates['partials/product/createProduct/upload']);
    Templates['partials/product/createProduct/confirm'] = require('../../../../lib/templates/partials/product/createProduct/confirm');
    Handlebars.registerPartial('product/createProduct/confirm', Templates['partials/product/createProduct/confirm']);
    Templates['partials/product/createProduct/crop'] = require('../../../../lib/templates/partials/product/createProduct/crop');
    Handlebars.registerPartial('product/createProduct/crop', Templates['partials/product/createProduct/crop']);

    // Accounts
    Templates['partials/account/registration/form'] = require('../../../../lib/templates/partials/account/registration/form');
    Templates['partials/account/registration/modal'] = require('../../../../lib/templates/partials/account/registration/modal');
    Templates['partials/account/login/form'] = require('../../../../lib/templates/partials/account/login/form');
    Templates['partials/account/login/modal'] = require('../../../../lib/templates/partials/account/login/modal');
    
    // TopBar
    Templates['partials/components/topbar/signedIn'] = require('../../../../lib/templates/partials/components/topbar/signedIn');
    Templates['partials/components/topbar/signedOut'] = require('../../../../lib/templates/partials/components/topbar/signedOut');

    // Forms
    Templates['partials/forms/addressForm'] = require('../../../../lib/templates/partials/forms/addressForm');
    Handlebars.registerPartial('forms/addressForm', Templates['partials/forms/addressForm']);
    Templates['partials/forms/creditCardForm'] = require('../../../../lib/templates/partials/forms/creditCardForm');
    Handlebars.registerPartial('forms/creditCardForm', Templates['partials/forms/creditCardForm']);
    Templates['partials/forms/promoCodeForm'] = require('../../../../lib/templates/partials/forms/promoCodeForm');
    Handlebars.registerPartial('forms/promoCodeForm', Templates['partials/forms/promoCodeForm']);

    // Cart
    Templates['partials/account/cart/cartItems'] = require('../../../../lib/templates/partials/account/cart/cartItems');
    Handlebars.registerPartial('account/cart/cartItems', Templates['partials/account/cart/cartItems']);
    Templates['partials/account/cart/cartItem'] = require('../../../../lib/templates/partials/account/cart/cartItem');
    Handlebars.registerPartial('account/cart/cartItem', Templates['partials/account/cart/cartItem']);

    // Checkout
    Templates['partials/account/checkout/shippingOptions'] = require('../../../../lib/templates/partials/account/checkout/shippingOptions');
    Templates['partials/account/checkout/shipping'] = require('../../../../lib/templates/partials/account/checkout/shipping');
    Handlebars.registerPartial('account/checkout/shipping', Templates['partials/account/checkout/shipping']);
    Templates['partials/account/checkout/billing'] = require('../../../../lib/templates/partials/account/checkout/billing');
    Handlebars.registerPartial('account/checkout/billing', Templates['partials/account/checkout/billing']);
    Templates['partials/account/checkout/confirm'] = require('../../../../lib/templates/partials/account/checkout/confirm');
    Handlebars.registerPartial('account/checkout/confirm', Templates['partials/account/checkout/confirm']);

    // Marketplace
    Templates['partials/marketplace/product'] = require('../../../../lib/templates/partials/marketplace/product');
    Handlebars.registerPartial('marketplace/product', Templates['partials/marketplace/product']);

    return Templates;
  }

};

module.exports = TemplateHelpers;