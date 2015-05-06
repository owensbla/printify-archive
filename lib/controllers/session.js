var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),
    bugsnag = require('bugsnag'),
    paymentGateway = require('../utils/paymentGateway'),
    Bluebird = require('bluebird'),

    CartItem = require('../models/cartItem'),
    User = require('../models/user'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse;

var SessionController = {

  // Return the current session (or unauthorized if there isn't one)
  get: function(req, res) {
    var _this = this;

    if (!req.user) return res.status(401).end();

    return User.objects.findOne({ id: req.user.id }).populate('userSettings')
      .then(function(user) {
        if (!user) return res.status(404).end();

        return [
          user,
          CartItem.objects.find().where({ user: user.id, isArchived: false }).populate('product').populate('photo')
        ];
      }).spread(function(user, cart) {
        user = user.toJSON();
        user.cartItems = _.map(cart, function(c) { return c.toJSON(); });
        paymentGateway.clientToken.generate({
          customerId: user.braintreeId
        }, function(err, resp) {
          if (err) user.braintreeClientToken = false;
          user.braintreeClientToken = resp.clientToken;
          res.status(200).json(user);
        });
      }).catch(function(err) {
        console.error(err);
        jsonErrorResponse(res);
        return false;
      });
  },

  // Sign a user in, create a new session.
  // This is called only AFTER passport successfully authenticates a user.
  login: function(req, res) {
    var email = req.body.email,
        password = req.body.password;

    if (!email || !password) return jsonErrorResponse(res, { message: 'You must supply an email and password to log in.', status: 400, });

    User.objects.findOne({ email: email }).then(function(user) {
      if (!user) {
        jsonErrorResponse(res, { message: 'The provided email or password is incorrect.', status: 400, errorCode: 'userNotFound' });
        return Bluebird.reject('userNotFound');
      }

      if (user.authenticate(password)) {
        return new Bluebird(function(resolve, reject) {
          req.login(user, function(err) {
            if (err) reject(err);
            resolve(user);
          });
        });
      } else {
        jsonErrorResponse(res, { message: 'The provided email or password is incorrect.', status: 400 });
        return Bluebird.reject('userNotFound');
      }
    }).then(function(user) {
      User.objects.update({ id: user.id }, {
        lastLogin: new Date(),
        lastLoginIp: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }).then(function(users) {
        return [
          User.objects.findOne({ id: user.id }).populate('userSettings'),
          CartItem.objects.find().where({ user: user.id, isArchived: false }).populate('product').populate('photo')
        ];
      }).spread(function(user, cart) {
        user = user.toJSON();
        user.cartItems = _.map(cart, function(c) { return c.toJSON(); });
        paymentGateway.clientToken.generate({
          customerId: user.braintreeId
        }, function(err, resp) {
          if (err) user.braintreeClientToken = false;
          user.braintreeClientToken = resp.clientToken;
          res.status(200).json(user);
        });
      });
    }).catch(function(err) {
      if (err === 'userNotFound') return;
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ControllerError:Session' });
      jsonErrorResponse(res);
    });
  },

  // Sign a user out, destroy a session
  logout: function(req, res) {
    req.logout();
    res.status(200).end();
  },

};

module.exports = SessionController;