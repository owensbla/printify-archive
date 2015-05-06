var Globals = require('../globals'),
    config = require('../config/env');

module.exports = {

  apiPath: function(route) {
    return Globals.API_PATH + route;
  },

  calculateResalePrice: function(variant, product) {
    price = parseInt(variant.price);

    switch (product.model) {
      case 'Poster':
        if (price < 15) {
          price = price * 1.6;
        } else if (price >= 15 && price < 30) {
          price = price * 1.5;
        } else {
          price = price * 1.4;
        }
        break;
      case 'Framed Poster':
        if (price < 15) {
          price = price * 1.5;
        } else if (price >= 15 && price < 30) {
          price = price * 1.4;
        } else {
          price = price * 1.3;
        }
        break;
      case 'Canvas':
        if (price < 15) {
          price = price * 1.35;
        } else if (price >= 15 && price < 30) {
          price = price * 1.3;
        } else {
          price = price * 1.25;
        }
        break;
    }

    return parseInt(price);
  },

  slugify: function(text) {
    return text.toString().toLowerCase()
                          .replace(/\"/g, '')
                          .replace(/\s+/g, '-')           // Replace spaces with -
                          .replace(/\-\-+/g, '-')         // Replace multiple - with single -
                          .replace(/^-+/, '')             // Trim - from start of text
                          .replace(/-+$/, '');            // Trim - from end of text
  },

  getAppContext: function() {
    return {
      env: config.env,
      isProduction: config.env === 'production',
      isStaging: config.env === 'staging',
      isDevelopment: config.env === 'development',
      BUGSNAG_API_KEY: config.BUGSNAG_API_KEY,
      SEGMENT_API_KEY: config.SEGMENT_API_KEY,
      VERSION: config.VERSION
    };
  },

  Responses: require('./responses')

};