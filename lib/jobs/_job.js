var extend = require('../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone');

var Job = function() {
  this.initialize.apply(this, arguments);
};

Job.prototype = {

  initialize: function() {},

};

Job.extend = extend;
_.extend(Job, Backbone.Events);

module.exports = Job;