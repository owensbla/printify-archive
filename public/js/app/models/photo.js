var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../globals'),
    App = Globals.App;

var Photo = Backbone.Model.extend({

  defaults: {},

  signRequest: function() {
    var _this = this,
        req;

    req = $.ajax({
      contentType: 'application/json',
      data: JSON.stringify({ filename: this.get('file').name }),
      dataType: 'json',
      type: 'POST',
      url: this.uploadUrl,
    });

    return req;
  },

  upload: function() {
    var _this = this,
        policy = this.get('policy'),
        file = this.get('file'),
        xhr = new XMLHttpRequest(),
        uploadForm = new FormData(),
        uploadReq = $.Deferred(),
        uploadImage = new Image(),
        fileReader = new FileReader(),
        saveReq;

    uploadForm.append('key', policy.key);
    uploadForm.append('AWSAccessKeyId', policy.accessKeyId);
    uploadForm.append('acl', policy.acl);
    uploadForm.append('policy', policy.policy);
    uploadForm.append('signature', policy.signature);
    uploadForm.append('Content-Type', policy.contentType);
    uploadForm.append('file', file);

    xhr.addEventListener('load', function(resp) {
      if (resp.target.status !== 204) {
        return uploadReq.reject({
          error: 'Oops! We ran in to an error uploading your file.' +
                  'If this problem persists, please contact <a href="mailto:support@printify.io">support@printify.io</a>.'
        });
      }

      fileReader.onload = function(e) {
        uploadImage.src = e.target.result;

        _this._file = _this.get('file');
        _this._fullImage = uploadImage;
        
        _this.set({
          filename: _this.get('file').name,
          height: uploadImage.height,
          title: _this.get('file').name,
          size: _this.get('file').size,
          url: _this.get('policy').key,
          width: uploadImage.width
        });
        saveReq = _this.save();
        saveReq.done(function() { uploadReq.resolve(_this); });
        saveReq.fail(function(resp) { uploadReq.reject(resp); });
      };

      fileReader.readAsDataURL(file);
    });

    xhr.addEventListener('error', function(e) {
      uploadReq.reject({
        error: 'Oops! We ran in to an error uploading your file.' +
                'If this problem persists, please contact <a href="mailto:support@printify.io">support@printify.io</a>.'
      });
    });

    xhr.open('POST', policy.bucketUrl);

    xhr.upload.addEventListener('progress', function(e) { App.events.trigger('upload:progress', e, _this); });

    xhr.send(uploadForm);

    return uploadReq;
  },

  saveCrop: function(opts) {
    var _this = this,
        req;

    req = $.ajax({
      contentType: 'application/json',
      data: JSON.stringify(opts),
      dataType: 'json',
      type: 'POST',
      url: this.url() + '/crop'
    });

    return req;
  },

  toJSON: function() {
    var attrs = _.clone(this.attributes);

    return attrs;
  },

  urlFragment: 'photo',

  uploadUrl: Globals.API_PATH + 'upload'

});

module.exports = Photo;