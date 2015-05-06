/**
 * CreditCard Model
 *
 * A stored Stripe credit card.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline'),
    paymentGateway = require('../utils/paymentGateway'),
    braintree = require('braintree'),
    Bluebird = require('bluebird'),
    bugsnag = require('bugsnag');

/* Attributes (fields on the model) */
var Attributes = {

  billingAddress: {
    defaultsTo: null,
    model: 'address'
  },

  braintreeToken: {
    required: true,
    type: 'string'
  },

  cardType: {
    required: true,
    type: 'string'
  },

  isDefault: {
    defaultsTo: false,
    type: 'boolean'
  },

  expirationMonth: {
    required: true,
    type: 'integer'
  },

  expirationYear: {
    required: true,
    type: 'integer'
  },

  expirationDate: {
    required: true,
    type: 'string'
  },

  last4: {
    required: true,
    type: 'string'
  },

  maskedNumber: {
    required: true,
    type: 'string'
  },

  imageUrl: {
    required: true,
    type: 'string'
  },

  user: {
    model: 'user',
    required: true
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  toJSON: function() {
    var obj = _.clone(this.toObject());

    delete obj.braintreeToken;

    return obj;
  }

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var CreditCard = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'creditcard',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes),

  createWithNonce: function(nonce, opts) {
    var user = opts.user,
        billingAddress = opts.billingAddress,
        isDefault = opts.isDefault || false;

    return new Bluebird(function(resolve, reject) {

      paymentGateway.paymentMethod.create({
        customerId: user.braintreeId,
        paymentMethodNonce: nonce,
        billingAddress: billingAddress.toBraintree(),
        options: {
          makeDefault: isDefault
        }
      }, function(err, result) {
        if (err) console.trace(err);
        if (err) bugsnag.notify(new Error(err), { errorName: 'ModelError:CreditCard' });
        if (err) return reject({ message: 'There was an error while attempting to save your credit card.', errorCode: 'createCardFailed' });
        if (!result.success) {
          var errorMessages = [];

          _.each(result.errors.deepErrors(), function (error) { errorMessages.push(error.message); });

          reject({
            message: 'Oops! The followed validation error(s) occured while trying to save your credit card: ' + errorMessages.join(', ') + '.',
            errorCode: 'createCardFailed'
          });
        } else {
          resolve(result.creditCard);
        }
      });

    }).then(function(braintreeCard) {

      return CreditCard.objects.create({
        billingAddress: _.isUndefined(billingAddress) ? null : billingAddress.id,
        braintreeToken: braintreeCard.token,
        cardType: braintreeCard.cardType,
        expirationMonth: braintreeCard.expirationMonth,
        expirationYear: braintreeCard.expirationYear,
        expirationDate: braintreeCard.expirationDate,
        last4: braintreeCard.last4,
        maskedNumber: braintreeCard.maskedNumber,
        imageUrl: braintreeCard.imageUrl,
        user: user.id,
        isDefault: braintreeCard.default
      });

    });
  }

}, LifecycleCallbacks));

module.exports = CreditCard;