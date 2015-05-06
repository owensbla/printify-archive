var extend = require('../../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Helpers = require('../../helpers'),
    Responses = Helpers.Responses,
    BaseResource = require('./_baseResource'),
    bugsnag = require('bugsnag');

OwnerResource = BaseResource.extend({

  createOnlyFields: [],
  ownerField: 'user',
  populate: [],
  readOnlyFields: [],
  where: {},

  _buildFilter: function() {
    var filter = {};

    filter[this.ownerField] = this.req.user.id;
    _.extend(filter, this.where);

    return filter;
  },

  getList: function(done) {
    var _this = this,
        whereFilter = this._buildFilter(),
        query;

    query = this.Model.objects.find().where(whereFilter)
      .paginate({ page: this._getPage(), limit: this._getLimit() });

    _.each(this.populate, function(relation) {
      query = query.populate(relation);
    });

    return query.then(function(models) {
        return models;
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ApiResourceError' });
        _this.jsonErrorResponse(_this.res);
        return false;
      });
  },

  getDetail: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        modelId = req.params.id,
        whereFilter = this._buildFilter(),
        query;

    query = this.Model.objects.findOne({ id: modelId }).where(whereFilter);

    _.each(this.populate, function(relation) {
      query = query.populate(relation);
    });

    return query.then(function(model) {
        if (!model) { return res.status(404).end(); }
        return model;
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ApiResourceError' });
        _this.jsonErrorResponse(res);
        return false;
      });
  },

  put: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        modelId = req.params.id,
        query;

    req.body = _.omit(req.body, this.readOnlyFields);

    return this.Model.objects.update(_.extend({ id: modelId }, this._buildFilter()), req.body).then(function(models) {
        if (!models.length) { return res.status(404).end(); }
        return models;
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ApiResourceError' });

        var errorObject = JSON.parse(JSON.stringify(err)),
            opts = {};

        if (_.has(errorObject, 'error') && errorObject.error === 'E_VALIDATION') {
          opts.message = errorObject.invalidAttributes;
          opts.status = errorObject.status;
        }

        _this.jsonErrorResponse(res, opts);
        return false;
      });
  },

  post: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        ownerFilter = {},
        query;

    // for POST, allow createOnlyFields to be passed
    var readOnlyFields = _.difference(this.readOnlyFields, this.createOnlyFields);

    ownerFilter[this.ownerField] = req.user.id;

    req.body = _.omit(req.body, readOnlyFields);

    return this.Model.objects.create(_.extend(req.body, ownerFilter)).then(function(created) {
        return created;
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ApiResourceError' });

        var errorObject = JSON.parse(JSON.stringify(err)),
            opts = {};

        if (_.has(errorObject, 'error') && errorObject.error === 'E_VALIDATION') {
          opts.message = errorObject.invalidAttributes;
          opts.status = errorObject.status;
        }

        _this.jsonErrorResponse(res, opts);
        return false;
      });
  },

  delete: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        modelId = req.params.id;

    return this.Model.objects.destroy(_.extend({ id: modelId }, this._buildFilter()))
      .then(function(model) {
        return res.status(204).end();
      }).catch(function(err) {
        console.trace(err);
        bugsnag.notify(new Error(err), { errorName: 'ApiResourceError' });
        _this.jsonErrorResponse(res);
        return false;
      });
  }

});


OwnerResource.extend = extend;
OwnerResource.prototype.jsonErrorResponse = Responses.jsonErrorResponse;

_.extend(OwnerResource, Backbone.Events);

module.exports = OwnerResource;