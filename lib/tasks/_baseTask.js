var extend = require('../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone');

var Task = function() {
  this.initialize.apply(this, arguments);
};

Task.prototype = {

  initialize: function() {},

};

Task.extend = extend;
_.extend(Task, Backbone.Events);

module.exports = Task;