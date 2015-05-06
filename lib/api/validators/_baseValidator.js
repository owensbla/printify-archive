var extend = require('../../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone');

var Validator = function(opts) {
  this.req = opts.req;
  this.res = opts.res;

  this.initialize.apply(this, arguments);
};

Validator.prototype = {

  initialize: function() {},

};

Validator.extend = extend;
_.extend(Validator, Backbone.Events);

module.exports = Validator;