var extend = require('../../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Helpers = require('../../helpers'),
    Responses = Helpers.Responses,
    BaseResource = require('./_baseResource');

ModelResource = BaseResource.extend({

  getList: function(done) {
    var _this = this;

    return this.Model.objects.find(this._buildFilter()).paginate({ page: this._getPage(), limit: this._getLimit() })
      .then(function(models) {
        return models;
      }).catch(function(err) {
        console.error(err);
        _this.jsonErrorResponse(_this.res);
        return false;
      });
  },

  getDetail: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        modelId = req.params.id;

    return this.Model.objects.findOne(_.extend({ id: modelId }, this._buildFilter()))
      .then(function(model) {
        if (!model) { return res.status(404).end(); }
        return model;
      }).catch(function(err) {
        console.error(err);
        _this.jsonErrorResponse(res);
        return false;
      });
  },

  put: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        modelId = req.params.id,
        readOnlyFields = this.readOnlyFields || [];

    req.body = _.omit(req.body, readOnlyFields);

    return this.Model.objects.update(_.extend({ id: modelId }, this._buildFilter()), req.body)
      .then(function(models) {
        if (!models.length) { return res.status(404).end(); }
        return models;
      }).catch(function(err) {
        console.error(err);

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
        createOnlyFields = this.createOnlyFields || [],
        readOnlyFields = this.readOnlyFields || [];

    // for POST, allow createOnlyFields to be passed
    readOnlyFields = _.difference(readOnlyFields, createOnlyFields);

    req.body = _.omit(req.body, readOnlyFields);

    return this.Model.objects.create(req.body)
      .then(function(created) {
        return created;
      }).catch(function(err) {
        console.error(err);

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
        console.error(err);
        _this.jsonErrorResponse(res);
        return false;
      });
  }

});


ModelResource.extend = extend;
ModelResource.prototype.jsonErrorResponse = Responses.jsonErrorResponse;

_.extend(ModelResource, Backbone.Events);

module.exports = ModelResource;