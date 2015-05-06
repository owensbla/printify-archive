var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),
    bugsnag = require('bugsnag'),
    paymentGateway = require('../utils/paymentGateway'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Models
    User = require('../models/user'),
    CartItem = require('../models/cartItem'),
    UserSettings = require('../models/userSettings'),

    // Validator
    UserValidator = require('../api/validators/user'),

    // Resources
    UserResource = require('../api/resources/user');

var getResource = function(req, res) {
  return new UserResource({
    req: req,
    res: res
  });
};

var getValidator = function(req, res) {
  return new UserValidator({
    req: req,
    res: res
  });
};

var UserController = {

  // Returns a list of users
  getList: function(req, res) {
    var userResource = getResource(req, res);

    userResource.getList().then(function(users) {
      res.status(200).json(_.map(users, function(user) { return user.toJSON(); }));
    });
  },

  // Returns a single user
  getDetail: function(req, res) {
    var userResource = getResource(req, res);

    userResource.getDetail().then(function(user) {
      res.status(200).json(user.toJSON());
    });
  },

  // Edits a user
  put: function(req, res) {
    var userResource = getResource(req, res);

    userResource.put().then(function(users) {
      var user = _.first(users);
      res.status(200).json(user.toJSON());
    });
  },

  // activate a user
  activate: function(req, res) {
    var userResource = getResource(req, res);

    userResource.activate().then(function(activated) {
      if (!activated) return res.redirect('/');
      res.redirect('/?activated=true');
    });
  },

  // Create a new user
  signup: function(req, res) {
    var userResource = getResource(req, res),
        userValidator = getValidator(req, res);

    var isValid = userValidator.validateSignup();
    if (isValid !== true) return jsonErrorResponse(res, isValid);

    // first, see if the user exists
    User.objects.find({
      username: req.body.email
    }).then(function(users) {
      // if a user is found, throw an error
      if (users.length) {
        return jsonErrorResponse(res, {
          message: 'The provided username or email already exists.',
          status: 400
        });
      }

      // if no user is found, signup
      return userResource.signup();
    }).then(function(user) {
      if (!user) return jsonErrorResponse(res);
      return [user, UserSettings.objects.findOne({ user: user.id })];
    }).spread(function(user, userSettings) {
      paymentGateway.clientToken.generate({
        customerId: user.braintreeId
      }, function(err, resp) {
        if (err) user.braintreeClientToken = false;
        user.braintreeClientToken = resp.clientToken;

        // login and send back the resp
        req.login(user, function(err) {
          if (err) console.log(err);

          user = user.toJSON();
          user.userSettings = userSettings.toJSON();

          res.status(200).json(user);
        });
      });
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ControllerError:User' });
      jsonErrorResponse(res);
    });

  },

  // Forgotten password request
  forgotPassword: function(req, res) {
    var userResource = new UserResource({
          req: req,
          res: res
        });

    userResource.forgotPassword().then(function(user) {
      res.status(200).json(user.toJSON());
    });
  },

  // Reset password request
  resetPassword: function(req, res) {
    var userResource = new UserResource({
          req: req,
          res: res
        });

    userResource.resetPassword().then(function(user) {
      res.status(200).json(user.toJSON());
    });
  }

};

module.exports = UserController;
