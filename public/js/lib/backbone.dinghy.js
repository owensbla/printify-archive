var Backbone = require('backbone'),
    Globals = require('../app/globals/'),
    _ = require('lodash');

_.extend(Backbone.Router.prototype, Backbone.Events, {
  before: function(){},
  after : function(){},
  route : function(route, name, callback) {

    if (!callback) callback = this[name];
    
    Backbone.history || (Backbone.history = new Backbone.History);
    
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    
    Backbone.history.route(route, _.bind(function(fragment) {
      var args = this._extractParameters(route, fragment);
      
      if( _(this.before).isFunction() ) { this.before.apply(this, args); }
      
      if (_(this.authenticate).isFunction()) {
        if (this.authenticate.apply(this, args) && this.authorize.apply(this, args)) {
          callback.apply(this, args);
          if( _(this.after).isFunction() ){
            this.after.apply(this, args);
          }
          this.trigger('route', name, args);
          this.trigger.apply(this, ['route:' + name].concat(args));
        }
      }
    }, this));
  }
});

/**
 * Base Dinghy view.
 */
Backbone.View = Backbone.View.extend({

  close: function(opts) {
    opts = opts ? opts : {};
    opts = _.extend({
      remove: false
    }, opts);

    if (this.onClose) {
      this.trigger('onClose');
      this.onClose();
    }
    
    if (opts.remove) {
      this.remove();
    } else {
      this.$el.html(''); // clear out this el's html
    }

    this.undelegateEvents();
    this.off();
  }

});

/**
 * Form view.
 */
Backbone.FormView = Backbone.View.extend({

  clearError: function(e) {
    var $el = $(e.currentTarget);
    this.validateField($el.attr('data-field'));
  },

  serializeField: function(fieldName) {
    var upperFieldName = fieldName ? _.first(fieldName).toUpperCase() + _.last(fieldName, fieldName.length - 1).join('') : false;
    if (upperFieldName && !_.isUndefined(this['serialize' + upperFieldName])) { return this['serialize' + upperFieldName](); }
    return this.$('.js-field[data-field="' + fieldName + '"]').val().trim();
  },

  serializeForm: function() {
    var _this = this,
        serialized = {},
        fieldName;

    _.each(this.fields, function(field, key) {
      if (_.isObject(_this.fields[key])) { fieldName = key; } else { fieldName = field; }
      if (_.isObject(_this.serializeField(fieldName))) {
        _.extend(serialized, _this.serializeField(fieldName));
      } else {
        serialized[fieldName] = _this.serializeField(fieldName);
      }
    });

    return serialized;
  },

  submitForm: function() {
    var json = this.serializeForm(),
        req;

    req = this.model.save(json);

    req.done(_.bind(this.onSuccess, this));
    req.fail(_.bind(this.onError, this));

    return req;
  },
  
  onSuccess: function() {
    this.setMessage({
      className: 'message--success',
      message: _.isUndefined(this.successMessage) ? 'Saved!' : this.successMessage
    });
  },
  
  onError: function(resp) {
    this.setMessage({
      className: 'message--error',
      message: Helpers.Forms.parseErrorResponse(resp)
    });
  },
  
  requiredValidator: function($field) {
    var $messageField = this.$('.js-field-message[data-field="' + $field.attr('data-field') + '"]'),
        isValid = true,
        _this = this;

    if (!$field.val() || $field.val().trim() === '') {
      $field.addClass('has-error');
      this.setMessage({
        message: 'This field is required.',
        className: 'message--error',
        $el: $messageField
      });
      isValid = false;
    } else {
      $field.removeClass('has-error');
      this.clearMessage($messageField);
    }

    return isValid;
  },

  integerValidator: function($field) {
    var fieldName = $field.attr('data-field'),
        $messageField = this.$('.js-field-message[data-field="' + fieldName + '"]'),
        isValid = true,
        _this = this;

    if (isNaN(parseInt($field.val()))) {
      $field.addClass('has-error');
      this.setMessage({
        message: _.has(this.fields[fieldName], 'message') ? this.fields[fieldName].message : 'This field must be an integer.',
        className: 'message--error',
        $el: $messageField
      });
      isValid = false;
    } else {
      $field.removeClass('has-error');
      this.clearMessage($messageField);
    }

    return isValid;
  },
  
  validateForm: function() {
    var validationResults = [],
        isValid = true,
        _this = this,
        fieldName;

    _.each(this.fields, function(field, key) {
      if (_.isObject(_this.fields[key])) { fieldName = key; } else { fieldName = field; }
      validationResults.push(_this.validateField(fieldName));
    });

    return _.every(validationResults);
  },

  validateField: function(fieldName) {
    var validationResults = [],
        isValid = true,
        _this = this,
        $field, field;

    field = this.fields[fieldName];
    $field = _this.$('.js-field[data-field="' + fieldName + '"]');

    if (_.isObject(field) && _.has(field, 'validators')) {
      _.each(field.validators, function(validator) {
        if (_.isFunction(_this[validator]) && isValid) { isValid = _this[validator]($field); }
      });
    }

    return isValid;
  },

  validateAndSubmitForm: function() {
    var _this = this,
        $saveButton = this.$(this.saveSelector),
        req;

    if (this.$el.hasClass('is-submitting')) { return; }

    if (this.validateForm()) {
      this.$el.addClass('is-submitting');
      req = this.submitForm();
      req.always(function() { _this.$el.removeClass('is-submitting'); });
      return req;
    } else {
      this.$('.has-error').first().focus();
      return false;
    }
  },

  setMessage: function(opts) {
    opts = opts ? opts : {};

    _.defaults(opts, {
      className: '',
      message: '',
      $el: this.$('.js-message')
    });

    this.clearMessage(opts.$el);
    opts.$el.html(opts.message).addClass(opts.className);
  },

  clearMessage: function($el) {
    $el = $el ? $el : this.$('.js-message');
    $el.removeClass('message--error message--info message--success').html('');
  },

  clearMessages: function() {
    var fields = this.fields,
        _this = this,
        fieldName;

    _.each(fields, function(field, key) {
      if (_.isObject(_this.fields[key])) { fieldName = key; } else { fieldName = field; }
      _this.clearMessage(_this.$('.js-field-message[data-field="' + fieldName + '"]'));
    });

    this.clearMessage();
  },

  resetForm: function() {
    var fields = this.fields,
        _this = this,
        fieldName;

    _.each(fields, function(field, key) {
      if (_.isObject(_this.fields[key])) { fieldName = key; } else { fieldName = field; }
      _this.$('.js-field[data-field="' + fieldName + '"]').val('');
    });

    this.clearMessages();
  }

});

Backbone.Model = Backbone.Model.extend({

  urlRoot: function() {
    return Globals.API_PATH + this.urlFragment;
  }

});

Backbone.Collection = Backbone.Collection.extend({

  url: function() {
    return Globals.API_PATH + this.urlFragment;
  }

});