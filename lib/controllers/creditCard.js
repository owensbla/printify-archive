var Helpers = require('../helpers'),
    passport = require('passport'),
    _ = require('lodash'),
    bugsnag = require('bugsnag'),

    // Responses
    Responses = Helpers.Responses,
    notImplemented = Responses.notImplemented,
    unauthorized = Responses.unauthorized,
    jsonErrorResponse = Responses.jsonErrorResponse,

    // Models
    Address = require('../models/address'),
    CreditCard = require('../models/creditCard'),

    // Resources
    CreditCardResource = require('../api/resources/creditCard');

var getResource = function(req, res) {
  return new CreditCardResource({
    req: req,
    res: res
  });
};

var CreditCardController = {

  // Returns a list of a user's creditCards
  getList: function(req, res) {
    var resource = getResource(req, res);

    resource.getList().then(function(creditCards) {
      res.status(200).json(_.map(creditCards, function(creditCard) { return creditCard.toJSON(); }));
    });
  },

  // Returns a single creditCard
  getDetail: function(req, res) {
    var resource = getResource(req, res);

    resource.getDetail().then(function(creditCard) {
      res.status(200).json(creditCard.toJSON());
    });
  },

  // Create a creditCard
  post: function(req, res) {
    var nonce = req.body.nonce,
        billingAddress = req.body.billingAddress,
        user = req.user,
        isDefault = req.body.isDefault || false;

    if (!nonce) return jsonErrorResponse(res);
    if (!billingAddress) return jsonErrorResponse(res, { message: 'You must supply a billing address.', status: 400 });

    Address.objects.findOne({ user: user.id, id: billingAddress }).then(function(billingAddress) {
      if (!billingAddress) return jsonErrorResponse(res, { message: 'Billing address not found.', status: 404 });
      return billingAddress;
    }).then(function(billingAddress) {
      return CreditCard.prototype.createWithNonce(nonce, { user: user, billingAddress: billingAddress, isDefault: isDefault });
    }).then(function(creditCard) {
      res.status(200).json(creditCard.toJSON());
    }).catch(function(err) {
      console.trace(err);
      if (_.has(err, 'errorCode') && err.errorCode === 'createCardFailed') {
        bugsnag.notify(new Error(err.message), { errorName: 'ControllerError:CreditCard' });
        jsonErrorResponse(res, { message: err.message, status: 400 });
      } else {
        bugsnag.notify(new Error(err), { errorName: 'ControllerError:CreditCard' });
        jsonErrorResponse(res);
      }
    });

  },

  // // Edits a creditCard
  // put: function(req, res) {
  //   var resource = getResource(req, res);

  //   resource.put().then(function(creditCards) {
  //     var creditCard = _.first(creditCards);
  //     res.status(200).json(creditCard.toJSON());
  //   });
  // },

  // delete: function(req, res) {
  //   var resource = getResource(req, res);
  //   resource.delete();
  // }

};

module.exports = CreditCardController;
