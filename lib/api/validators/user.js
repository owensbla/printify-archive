var extend = require('../../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Helpers = require('../../helpers'),
    Responses = Helpers.Responses,
    BaseValidator = require('./_baseValidator'),
    validator = require('validator');

UserValidator = BaseValidator.extend({

  validateSignup: function() {
    var req = this.req,
        res = this.res;

    var requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmedTerms', 'newsletterOptIn'],
        missingFields;

    if (_.difference(requiredFields, _.keys(req.body)).length) {
      missingFields = _.difference(requiredFields, _.keys(req.body));
      return {
        message: 'Oops! It looks like the following required field(s) are missing: ' + missingFields.join(', ') + '.',
        status: 400
      };
    }

    var email = req.body.email,
        username = req.body.username,
        password = req.body.password,
        firstName = req.body.firstName,
        lastName = req.body.lastName;

    if (!validator.isEmail(email)) return { message: 'Please enter a valid email.', status: 400 };
    if (password.length < 8 || password.length > 30) return { message: 'Passwords must be 8 to 30 characters long.', status: 400 };
    if (firstName.length > 60) return { message: 'First name must be less than 60 characters.', status: 400 };
    if (lastName.length > 60) return { message: 'Last name must be less than 60 characters.', status: 400 };

    return true;
  },

  validateLogin: function() {
    var req = this.req,
        res = this.res;

    var requiredFields = ['email', 'password'],
        missingFields;

    if (_.difference(requiredFields, _.keys(req.body)).length) {
      missingFields = _.difference(requiredFields, _.keys(req.body));
      return { message: 'Please enter an email and password.', status: 400 };
    }

    return true;
  },

  validate: function() {
    var req = this.req,
        res = this.res;

    return true;
  }

});


UserValidator.extend = extend;
UserValidator.prototype.jsonErrorResponse = Responses.jsonErrorResponse;

_.extend(UserValidator, Backbone.Events);

module.exports = UserValidator;