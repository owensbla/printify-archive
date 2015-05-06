var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App,
    Address = require('../models/address');

var Addresses = Backbone.Collection.extend({

  model: Address,

  urlFragment: 'address'

});

module.exports = Addresses;