var config = require('../config/env'),
    Bluebird = require('bluebird'),
    _ = require('lodash');

var PrintioClient = function() {
  this.initialize.apply(this, arguments);
};

PrintioClient.prototype = {

  API_KEY: config.PRINTIO_KEY,
  API_VERSION: '0.1',
  BASE_URL: 'api.print.io',
  COUNTRY_CODE: 'US',
  SOURCE: 'api',

  PRODUCTS: [
    'Professional Prints',
  ],

  RESOURCES: {
    countries: 'countries',
    orders: 'orders',
    products: 'products',
    productVariants: 'productvariants',
    shippingPrices: 'shippingprices',
    shippingEstimates: 'shippriceestimate'
  },

  initialize: function() {
    this.apiPath = '/api/v/' + this.API_VERSION + '/source/api';
  },

  _getPath: function(resource, params) {
    var path = '/' + resource,
        queryString = '?countryCode=' + this.COUNTRY_CODE + '&recipeId=' + this.API_KEY;

    params = params ? params : {};

    _.each(params, function(value, key) {
      queryString = queryString + '&' + encodeURIComponent(key) + '=' + encodeURIComponent(value);
    });

    return this.apiPath + path + queryString;
  },

  _parseResponse: function(resp) {
    var json = JSON.parse(resp);
    return json;
  },

  get: function(resource, params) {
    return this.request({
      method: 'GET',
      path: this._getPath(this.RESOURCES[resource], params)
    });
  },

  put: function(resource, params) {
    console.log('NOT YET IMPLEMENTED');
  },

  post: function(resource, params) {
    return this.request({
      method: 'POST',
      path: this._getPath(this.RESOURCES[resource], params)
    });
  },

  delete: function(resource, params) {
    console.log('NOT YET IMPLEMENTED');
  },

  request: function(opts) {
    var https = require('https'),
        _this = this,
        req;

    if (!opts.method || !opts.path) {
      console.trace('You must supply a method and path the PrintioClient.');
      return;
    }

    _.defaults(opts, {
      host: this.BASE_URL,
      post: 443
    });

    // return a Bluebird promise
    return new Bluebird(function(resolve, reject) {

      var req = https.request(opts, function(resp) {
        var body = '',
            statusCode = resp.statusCode;

        resp.on('data', function(chunk) { body += chunk; });

        resp.on('end', function() {
          if (statusCode < 200 && statusCode >= 300) {
            console.trace('Error making request to print.io servers. Status Code: ' + statusCode +  ' Response: ');
            console.log(JSON.parse(body));
            reject('Error making request to print.io servers.');
            return;
          } else {
            resolve(_this._parseResponse(body));
          }
        });

      }).on('error', function(err) {
        console.trace(err);
        reject({
          Message: 'Error making the request to print.io. Please check your console/logs.'
        });
      });

      req.end();

    });
  }

};

module.exports = PrintioClient;
