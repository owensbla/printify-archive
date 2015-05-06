/**
 * Address Model
 *
 * A user address (personal, billing, shipping, etc.).
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline');

/* Attributes (fields on the model) */
var Attributes = {

  address1: {
    required: true,
    type: 'string'
  },

  address2: {
    defaultsTo: null,
    type: 'string'
  },

  addressType: {
    required: true,
    type: 'string'
  },

  city: {
    required: true,
    type: 'string'
  },

  firstName: {
    required: true,
    type: 'string'
  },

  isArchived: {
    defaultsTo: false,
    type: 'boolean'
  },

  lastName: {
    required: true,
    type: 'string'
  },

  state: {
    required: false,
    type: 'string'
  },

  country: {
    required: true,
    type: 'string'
  },

  user: {
    model: 'user',
    required: true
  },

  zipCode: {
    required: true,
    type: 'string'
  }

};

/* Custom methods on the model. */
var InstanceMethods = {

  toBraintree: function() {
    var obj = {};

    obj.streetAddress = this.streetAddress1;
    obj.extendedAddress = this.streetAddress2 !== null ? this.streetAddress2 : '';
    if (this.country.length === '2') {
      obj.countryCodeAlpha2 = this.country;
    } else if (this.country.length === '3') {
      obj.countryCodeAlpha3 = this.country;
    }
    obj.firstName = this.firstName;
    obj.lastName = this.lastName;
    obj.locality = this.city;
    obj.region = this.state;
    obj.postalCode = this.zipCode;

    return obj;
  },

  getFullName: function() {
    if (!this.firstName && !this.lastName) return '';
    if (this.firstName && !this.lastName) return this.firstName;
    if (!this.firstName && this.lastName) return this.lastName;
    return this.firstName + ' ' + this.lastName;
  },

  getFormattedAddress: function() {
    var formattedAddress = '';

    formattedAddress = this.address1;
    if (this.address2) formattedAddress = formattedAddress + ' ' + this.address2;
    formattedAddress += ', ' + this.city;
    if (this.state) formattedAddress += ', ' + this.state;
    formattedAddress += ' ' + this.country;
    formattedAddress += ' ' + this.zipCode;

    return formattedAddress;
  },

  toJSON: function() {
    var obj = _.clone(this.toObject());

    obj.fullName = this.getFullName();
    obj.formattedAddress = this.getFormattedAddress();

    return obj;
  },

};

/* Lifecycle callsback for the model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var Address = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'address',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = Address;