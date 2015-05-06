var _ = require('lodash'),
    config = require('../../config/env'),
    passport = require('passport'),
    
    OwnerResource = require('./_ownerResource'),
    User = require('../../models/user'),

    UserMailer = require('../../mailers/user');

var UserResource = OwnerResource.extend({

  ownerField: 'id',

  populate: ['userSettings'],

  readOnlyFields: [
    'addresses',
    'username',
    'email',
    'lastLogin',
    'lastLoginIp',
    'dateActivated',
    'thumb40',
    'thumb200',
    'thumb300',
    'userSettings',
    'createdAt',
    'updatedAt',
    'id',
    'activationToken',
    'confirmedEmail',
    'isActive',
    'resetToken',
    'isAdmin',
    'confirmedTerms'
  ],

  Model: User,

  post: function() {
    var _this = this,
        req = this.req,
        res = this.res;

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

  // Creates a new user and sends the activation email.
  signup: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        registrationFields = ['email', 'username', 'password', 'firstName', 'lastName', 'newsletterOptIn', 'confirmedTerms'];

    req.body = _.pick(req.body, registrationFields);
    req.body.lastLogin = new Date();
    req.body.lastLoginIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // set username to be same as email if we don't explicitly set a username
    if (!req.body.username) req.body.username = req.body.email;

    return this.post().then(function(created) {
        if (!created) { return false; }
        if (config.requireActivation) {
          UserMailer.sendActivationEmail({ user: created });
        } else {
          UserMailer.sendWelcomeEmail(created);
        }
        if (created.newsletterOptIn) UserMailer.subscribeToMailchimp(created);
        return created;
      }).catch(function(err) {
        console.error(err);
        _this.jsonErrorResponse(res);
        return false;
      });
  },

  // Activates a user.
  activate: function() {
    var _this = this,
        req = this.req,
        res = this.res,
        userId = req.params.id,
        activationToken = req.params.token;

    return User.objects.findOne({ id: userId })
      .then(function(user) {
        if (!user) { return res.status(404).end(); }
        return user;
      }).then(function(user) {

        return user.activate(activationToken).then(function(activated) {
          if (!activated) {
            var opts = {};

            opts.message = 'Invalid token.';
            opts.status = 400;

            return _this.jsonErrorResponse(res, opts);
          }

          return activated;
        }).catch(function(err) {
          console.error(err);
          _this.jsonErrorResponse(res);
          return false;
        });

      }).then(function(promise) {
        return promise;
      }).catch(function(err) {
        console.error(err);
        _this.jsonErrorResponse(res);
        return false;
      });
  },

  resetPassword: function() {

  },

  forgotPassword: function() {

  }

});


module.exports = UserResource;