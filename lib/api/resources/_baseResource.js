var extend = require('../../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone');

var Resource = function(opts) {
  this.req = opts.req;
  this.res = opts.res;

  this.initialize.apply(this, arguments);
};

Resource.prototype = {

  limit: 40,
  offset: 0,
  page: 1,
  where: {},

  initialize: function() {},

  _buildFilter: function() {
    return this.where;
  },

  _getPage: function() {
    return this.req.query.page || this.page;
  },

  _getLimit: function() {
    return this.req.query.limit || this.limit;
  }

};

Resource.extend = extend;
_.extend(Resource, Backbone.Events);

module.exports = Resource;