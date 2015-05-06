var Helpers = require('../../helpers'),
    passport = require('passport'),
    _ = require('lodash'),

    // Models
    Order = require('../../models/order'),
    Product = require('../../models/product');

var AdminController = {

  home: function(req, res) {
    res.render('admin/home', _.extend({
      layout: 'admin',
      user: req.user
    }, Helpers.getAppContext()));
  },

  orders: function(req, res) {
    res.render('admin/orders', _.extend({
      layout: 'admin',
      user: req.user
    }, Helpers.getAppContext()));
  }

};

module.exports = AdminController;
