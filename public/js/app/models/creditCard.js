var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App;

var CreditCard = Backbone.Model.extend({

  defaults: {},

  toJSON: function() {
    var attrs = _.clone(this.attributes);

    return attrs;
  },

  urlFragment: 'credit-card',

});

module.exports = CreditCard;