var extend = require('../../utils/extend'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Helpers = require('../../helpers'),
    Responses = Helpers.Responses,
    BaseValidator = require('./_baseValidator');

OrderValidator = BaseValidator.extend({

  validateCheckout: function() {
    var req = this.req,
        res = this.res;

    if (!req.body.creditCard) return { message: 'You must select a credit card.', status: 400 };

    // validate shipping fields
    var requiredShippingFields = ['shippingFirstName', 'shippingLastName', 'shippingAddress1', 'shippingCity',
                                 'shippingState', 'shippingZipCode', 'shippingCountry', 'shippingMethod'],
        missingShippingFields;

    if (_.difference(requiredShippingFields, _.keys(req.body)).length) {
      missingShippingFields = _.difference(requiredShippingFields, _.keys(req.body));
      return {
        message: 'Oops! It looks like the following required shipping fields are missing: ' + missingShippingFields.join(', ') + '.',
        status: 400
      };
    }

    // validate billing fields
    var requiredBillingFields = ['billingFirstName', 'billingLastName', 'billingAddress1', 'billingCity',
                                 'billingState', 'billingZipCode', 'billingCountry'],
        missingBillingFields;

    if (_.difference(requiredBillingFields, _.keys(req.body)).length) {
      missingBillingFields = _.difference(requiredBillingFields, _.keys(req.body));
      return {
        message: 'Oops! It looks like the following required billing fields are missing: ' + missingBillingFields.join(', ') + '.',
        status: 400
      };
    }

    return true;
  },

  validate: function() {
    var req = this.req,
        res = this.res;

    if (!req.body.creditCard) return { message: 'You must select a credit card.', status: 400 };
    if (!req.body.orderItems) return { message: 'You must provide order items.', status: 400 };

    // validate shipping fields
    var requiredShippingFields = ['shippingFirstName', 'shippingLastName', 'shippingAddress1', 'shippingCity',
                                 'shippingState', 'shippingZipCode', 'shippingCountry', 'shippingMethod'],
        missingShippingFields;

    if (_.difference(requiredShippingFields, _.keys(req.body)).length) {
      missingShippingFields = _.difference(requiredShippingFields, _.keys(req.body));
      return {
        message: 'Oops! It looks like the following required shipping fields are missing: ' + missingShippingFields.join(', ') + '.',
        status: 400
      };
    }

    // validate billing fields
    var requiredBillingFields = ['billingFirstName', 'billingLastName', 'billingAddress1', 'billingCity',
                                 'billingState', 'billingZipCode', 'billingCountry'],
        missingBillingFields;

    if (_.difference(requiredBillingFields, _.keys(req.body)).length) {
      missingBillingFields = _.difference(requiredBillingFields, _.keys(req.body));
      return {
        message: 'Oops! It looks like the following required billing fields are missing: ' + missingBillingFields.join(', ') + '.',
        status: 400
      };
    }

    return true;
  }

});


OrderValidator.extend = extend;
OrderValidator.prototype.jsonErrorResponse = Responses.jsonErrorResponse;

_.extend(OrderValidator, Backbone.Events);

module.exports = OrderValidator;