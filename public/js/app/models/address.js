var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App;

var Address = Backbone.Model.extend({

  defaults: {},

  getFullName: function() {
    return this.get('firstName') + ' ' + this.get('lastName');
  },

  toJSON: function() {
    var attrs = _.clone(this.attributes);

    attrs.fullName = this.getFullName();

    return attrs;
  },

  urlFragment: 'address',

});

module.exports = Address;