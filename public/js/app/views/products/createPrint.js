var $ = require('jquery'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Globals = require('../../globals'),
    Helpers = require('../../helpers'),
    App = Globals.App,

    // Models
    CartItem = require('../../models/cartItem'),
    Photo = require('../../models/photo'),

    // Views
    UploadController = require('../upload/uploadController');

var CreatePrintView = Backbone.View.extend({
  
  template: App.Templates['layouts/pages/createPrint'],
  uploadTemplate: App.Templates['partials/product/createProduct/upload'],
  cropTemplate: App.Templates['partials/product/createProduct/crop'],
  confirmTemplate: App.Templates['partials/product/createProduct/confirm'],

  events: {
    'click .js-upload-input': 'onUploadClick',
    'click .js-crop:not(.disabled)': 'saveCropAndContinue',
    'click .js-add-to-cart:not(.disabled)': 'addToCartAndContinue',
    'click .js-rotate-crop': 'onRotateCrop'
  },

  initialize: function(opts) {
    this.stepTemplates = [this.uploadTemplate, this.cropTemplate, this.confirmTemplate];
    this.router = opts.router;
    this.model = opts.product;
    this.jcropApi = false;
    this.rotateCrop = false;

    analytics.track('Started Creating Print', {
      'Product Model': this.model.get('model'),
      'Product Name': this.model.get('name'),
      'Product Size': this.model.get('size'),
      'Product Price': this.model.get('price')
    });

    this.setElement(Globals.CONTENT_ELEMENT);

    this.listenTo(this, 'ready', _.bind(this.onReady, this));

    this.trigger('ready');
  },

  onReady: function() {
    if (App.state.get('initialLoad')) {
      this.bindEvents();

      this.uploadController  = new UploadController({
        el: this.$('.js-upload'),
        product: this.model
      });

      App.state.set('loading', false);

      return;
    }

    this.render().bindEvents();

    this.uploadController  = new UploadController({
      el: this.$('.js-upload'),
      product: this.model
    });

    App.state.set('loading', false);
  },

  bindEvents: function() {
    this.listenTo(App.events, 'uploadController:uploadComplete', _.bind(this.onUploadComplete, this));
    this.listenTo(App.events, 'uploadController:uploadError', _.bind(this.onUploadError, this));
    this.listenTo(App.events, 'uploadController:policyError', _.bind(this.onPolicyError, this));
    this.listenTo(App.events, 'upload:progress', _.bind(this.onProgress, this));
    
    this.undelegateEvents();
    this.delegateEvents();

    if (this.uploadController) this.uploadController.setElement(this.$('.js-upload'));
    
    return this;
  },

  unbindEvents: function() {
    this.stopListening();
    this.undelegateEvents();
    return this;
  },

  getContext: function() {
    var context = {};

    context.product = this.model.toJSON();
    context.photo = !_.isUndefined(this.photo) ? this.photo.toJSON() : {};
    context.crop = !_.isUndefined(this.crop) ? this.crop.toJSON() : {};
    context.isCanvas = this.model.get('model').toLowerCase() === 'canvas';

    return context;
  },

  render: function() {
    this.$el.html(this.template(this.getContext()));
    return this;
  },

  renderStep: function(step) {
    var _this = this,
        template = this.stepTemplates[step - 1],
        fetchDelay = 500,
        renderTemplate, imageToLoad, req;

    this.$('.js-step.is-active').addClass('is-complete').removeClass('is-active');
    this.$('.js-step[data-step="' + step + '"]').addClass('is-active');

    // simply render the upload template
    if (template === this.uploadTemplate) {
      this.$('.create--wrapper').html(template(this.getContext()));
      this.unbindEvents().bindEvents();
      return;
    }

    // for crop and confirm templates, make sure the images are available
    // on s3 before loading
    App.state.set('loading', true);

    if (template === this.cropTemplate) {
      imageToLoad = this.photo.get('fullUrl');
    } else if (template === this.confirmTemplate) {
      imageToLoad = this.crop.get('fullThumbnailUrl');
    }

    (function waitForImage() {
      req = $.get(imageToLoad);
      req.done(function() { renderTemplate(); });
      req.fail(function() { _.delay(waitForImage, fetchDelay); fetchDelay = fetchDelay * 2; });
    })();

    renderTemplate = _.bind(function() {
      this.$('.create--wrapper').html(template(this.getContext()));
      this.unbindEvents().bindEvents();

      if (template === this.cropTemplate) {
        var $crop = this.$('.js-jcrop'),
            printSize = this.model.get('size'),
            imageWidth, imageHeight,
            printWidth, printHeight, aspectRatio;

        $crop.load(function() {
          imageWidth = $crop.width();
          imageHeight = $crop.height();
          printWidth = parseInt(printSize.split('x')[0]);
          printHeight = parseInt(printSize.split('x')[1]);

          // canvas prints add 1.5" on each side
          if (_this.model.get('model').toLowerCase() === 'canvas') {
            printWidth = printWidth + 6;
            printHeight = printHeight + 6;
          }

          if (imageHeight / imageWidth === printHeight / printWidth) _this.rotateCrop = true;

          aspectRatio = _this.rotateCrop ?
                        printHeight / printWidth :
                        printWidth / printHeight;
          
          $crop.removeClass('is-loading').Jcrop({
            aspectRatio: aspectRatio,
            setSelect: _this.rotateCrop ? [0, 0, imageHeight, imageWidth] : [0, 0, imageWidth, imageHeight],
            minSize: [100, 100]
          }, function() { _this.jcropApi = this; });

          App.state.set('loading', false);
        });
      } else {
        var $thumb = this.$('.js-thumb');

        $thumb.load(function() {
          App.state.set('loading', false);

          var pixelWidth = parseInt(_this.photo.get('width')),
              printWidth = parseInt(_this.model.get('size').split('x')[0]),
              dpi = Math.round(pixelWidth / printWidth);

          // check for 150 DPI
          if (dpi < 150) {
            swal({
              title: 'Hold on!',
              text: 'It looks like your photo is only ' + dpi + ' dpi. We cannot guarantee the quality ' +
                    'of prints that are less than 150 dpi. Do you want to go ahead and submit ' +
                    'this print or would you like to upload a higher quality photograph?',
              type: 'warning',
              showCancelButton: true,
              confirmButtonText: 'I\'ll Continue',
              cancelButtonText: 'Let Me Reupload'
            }, function(isConfirm) {
              if (!isConfirm) _this.unbindEvents().render().bindEvents();
            });
          }
        });
      }
    }, this);
  },

  onRotateCrop: function() {
    var $image = this.$('.js-jcrop'),
        printSize = this.model.get('size'),
        imageWidth = $image.width(),
        imageHeight = $image.height(),
        printWidth = parseInt(printSize.split('x')[0]),
        printHeight = parseInt(printSize.split('x')[1]);

    // canvas prints add 1.5" on each side
    if (this.model.get('model').toLowerCase() === 'canvas') {
      printWidth = printWidth + 6;
      printHeight = printHeight + 6;
    }

    this.rotateCrop = !this.rotateCrop;

    if (this.rotateCrop) {
      this.jcropApi.setOptions({ aspectRatio: printHeight / printWidth });
      this.jcropApi.setSelect([0, 0, imageHeight, imageWidth]);
    } else {
      this.jcropApi.setOptions({ aspectRatio: printWidth / printHeight });
      this.jcropApi.setSelect([0, 0, imageWidth, imageHeight]);
    }
  },

  onProgress: function(progressEvent) {
    // TODO: handle browser support
    var percentComplete = parseInt((progressEvent.loaded / progressEvent.total) * 100);

    this.$('.create--upload-perc').text(percentComplete + '%');
  },

  gotoNextStep: function() {
    var step = parseInt(this.$('.js-step.is-active').attr('data-step'));
    this.renderStep(step + 1);
  },

  onUploadClick: function(e) {
    // if they're signed in, don't do anything
    if (App.session.isSignedIn()) return;

    // if they aren't signed in, prompt them to register now and prevent default
    e.preventDefault();
    e.stopPropagation();

    swal({
      title: 'Create an Account',
      text: 'You\'re almost there! To create your first print, you need an account. Create an account now and you\'ll get 5% off your first purchase!',
      type: 'info',
      confirmButtonText: 'Okay'
    }, function() {
      App.events.trigger('showRegisterModal');
    });
  },

  addToCartAndContinue: function() {
    var _this = this,
        req;

    // create cart item using the cropped photo
    this.cartItem = new CartItem({ photo: this.crop.get('id'), product: this.model.get('id') });

    Helpers.UI.addSpinner(this.$('.js-add-to-cart'));

    req = this.cartItem.save();

    req.done(_.bind(this.onCartSuccess, this));
    req.fail(_.bind(this.onCartError, this));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-add-to-cart')); });
  },

  onCartSuccess: function() {
    var _this = this;

    App.persist.get('cart').add(this.cartItem);

    swal({
      title: 'Added to Cart',
      text: 'Awesome! The ' + this.model.get('size') + ' ' + this.model.get('formattedModel') + ' has been added to your cart.',
      type: 'success',
      confirmButtonText: 'Got It!'
    }, function() {
      _this.router.navigate('account/cart', { trigger: true, replace: false });
    });

    analytics.track('Print Added To Cart', {
      'Product Model': this.model.get('model'),
      'Product Name': this.model.get('name'),
      'Product Size': this.model.get('size'),
      'Product Price': this.model.get('price')
    });
  },

  onCartError: function(resp) {
    swal({
      title: 'Cropping Error',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error',
      confirmButtonText: 'Okay'
    });
  },

  // grab crop params from jcrop and normalize them for the reduced image size
  getCropParams: function() {
    var fullImage = this.photo._fullImage,
        $domImage = this.$('.js-jcrop'),
        domImageHeight = $domImage.height(),
        domImageWidth = $domImage.width(),
        fullImageHeight = fullImage.height,
        fullImageWidth = fullImage.width,
        heightResizeRatio = fullImageHeight / domImageHeight,
        widthResizeRatio = fullImageWidth / domImageWidth,
        cropSelection = this.jcropApi.tellSelect();

    return {
      x: cropSelection.x * widthResizeRatio,
      y: cropSelection.y * heightResizeRatio,
      width: cropSelection.w * widthResizeRatio,
      height: cropSelection.h * heightResizeRatio
    };
  },

  saveCropAndContinue: function() {
    var _this = this,
        req;

    Helpers.UI.addSpinner(this.$('.js-crop'));

    req = this.photo.saveCrop(this.getCropParams());

    req.done(_.bind(this.onCropComplete, this));
    req.fail(_.bind(this.onCropError, this));
    req.always(function() { Helpers.UI.removeSpinner(_this.$('.js-crop')); });
  },

  onCropComplete: function(resp) {
    this.crop = new Photo(resp);
    this.gotoNextStep();

    analytics.track('Cropped Picture For Print', {
      'Product Model': this.model.get('model'),
      'Product Name': this.model.get('name'),
      'Product Size': this.model.get('size'),
      'Product Price': this.model.get('price')
    });
  },

  onCropError: function(resp) {
    swal({
      title: 'Cropping Error',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error',
      confirmButtonText: 'Okay'
    });
  },

  onUploadComplete: function(photo) {
    var _this = this;

    this.photo = photo;

    analytics.track('Uploaded Picture For Print', {
      'Product Model': this.model.get('model'),
      'Product Name': this.model.get('name'),
      'Product Size': this.model.get('size'),
      'Product Price': this.model.get('price')
    });

    this.gotoNextStep();

    swal({
      title: 'Upload Complete',
      text: 'Great! Now, let\'s crop your image and you\'ll be all set!',
      type: 'success',
      confirmButtonText: 'Okay',
    });
  },

  onUploadError: function(errorMessage) {
    errorMessage = errorMessage || 'Oops! We ran in to an error uploading your file. If this problem persists, please contact support@printify.io.';
    swal({
      title: 'Upload Error',
      text: errorMessage,
      type: 'error',
      confirmButtonText: 'Okay'
    });

    this.$('.js-upload-input').replaceWith(this.$('.js-upload-input').clone(true));
  },

  onPolicyError: function(resp) {
    swal({
      title: 'Upload Error',
      text: Helpers.Forms.parseErrorResponse(resp),
      type: 'error',
      confirmButtonText: 'Okay'
    });

    this.$('.js-upload-input').replaceWith(this.$('.js-upload-input').clone(true));
  },

  onClose: function() {
    this.uploadController.close();
    this.unbindEvents();
  }

});

module.exports = CreatePrintView;