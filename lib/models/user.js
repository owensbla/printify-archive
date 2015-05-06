/**
 * User Model
 */
var config = require('../config/env'),
    Helpers = require('../helpers'),
    _ = require('lodash'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    bugsnag = require('bugsnag'),
    Waterline = require('waterline'),
    Bluebird = require('bluebird'),
    Printful = require('../utils/printful'),
    braintree = require('braintree'),
    paymentGateway = require('../utils/paymentGateway'),

    CartItem = require('./cartItem'),
    PromoCode = require('./promoCode'),
    UserSettings = require('./userSettings');

/* Attributes (fields on the user model) */
var Attributes = {

  addresses: {
    collection: 'address',
    via: 'user'
  },

  braintreeId: {
    defaultsTo: '',
    type: 'string'
  },

  username: {
    type: 'string',
    minLength: 1,
    required: true,
    unique: true
  },

  password: {
    type: 'string',
    minLength: 8,
    maxLength: 128,
    required: true
  },

  email: {
    type: 'email',
    required: true,
    unique: true
  },

  firstName: {
    defaultsTo: '',
    type: 'string',
    maxLength: 60
  },

  lastName: {
    defaultsTo: '',
    type: 'string',
    maxLength: 60
  },

  isAdmin: {
    defaultsTo: false,
    type: 'boolean'
  },

  lastLogin: {
    defaultsTo: null,
    type: 'datetime'
  },

  lastLoginIp: {
    defaultsTo: null,
    type: 'string'
  },

  dateActivated: {
    defaultsTo: null,
    type: 'datetime'
  },

  isActive: {
    defaultsTo: !config.requireActivation,
    type: 'boolean'
  },

  confirmedEmail: {
    defaultsTo: false,
    type: 'boolean'
  },

  activationToken: {
    defaultsTo: '',
    type: 'string',
  },

  resetToken: {
    defaultsTo: '',
    type: 'string',
  },

  cartItems: {
    collection: 'cartitem',
    via: 'user'
  },

  userSettings: {
    defaultsTo: null,
    model: 'userSettings'
  },

  newsletterOptIn: {
    required: true,
    type: 'boolean'
  },

  confirmedTerms: {
    required: true,
    type: 'boolean'
  }

  // location: {
  //   defaultsTo: '',
  //   maxLength: 255,
  //   type: 'string'
  // },

  // website: {
  //   defaultsTo: '',
  //   type: 'url'
  // },

  // facebook: {
  //   defaultsTo: '',
  //   maxLength: 255,
  //   type: 'string'
  // },

  // twitter: {
  //   defaultsTo: '',
  //   maxLength: 255,
  //   type: 'string'
  // },

  // bio: {
  //   defaultsTo: '',
  //   maxLength: 400,
  //   type: 'text'
  // },

  // pic: {
  //   defaultsTo: '',
  //   type: 'string'
  // },

  // thumb40: {
  //   defaultsTo: '',
  //   type: 'string'
  // },

  // thumb200: {
  //   defaultsTo: '',
  //   type: 'string'
  // },

  // thumb300: {
  //   defaultsTo: '',
  //   type: 'string'
  // },

};

/* Custom methods on the user model. */
var InstanceMethods = {

  /* Activates a user. */
  activate: function(token) {
    return User.objects.update({ id: this.id, activationToken: token }, { confirmedEmail: true })
      .then(function(users) {
        if (!users.length) { return false; }
        return _.first(users);
      });
  },

  /* Authenticate the user. */
  authenticate: function(password) {
    return bcrypt.compareSync(password, this.password);
  },

  // Generates a promocode for the user
  generatePromoCode: function(opts) {
    var code = opts.prefix || 'PROMO';
    code = code + '_' + (new Date()).getTime().toString(36).toUpperCase();

    return PromoCode.objects.create({
      code: code,
      discount: opts.discount,
      discountType: opts.discountType,
      usesRemaining: opts.usesRemaining || 1,
      expirationDate: opts.expirationDate || null
    });
  },

  getCartSubtotal: function(cartItems) {
    var totals = {};

    if (cartItems) {
      return new Bluebird(function(resolve, reject) {
        return resolve(_.reduce(cartItems, function(memo, cartItem) { return memo + cartItem.product.price; }, 0.0));
      });
    } else {
      return CartItem.objects.where({ user: this.id, isArchived: false }).populate('product').then(function(cartItems) {
        return _.reduce(cartItems, function(memo, cartItem) { return memo + cartItem.product.price; }, 0.0);
      });
    }

  },

  calculateShippingRates: function(location, cartItems) {
    var requestBody = {
          items: [],
          recipient: {}
        },
        _this = this,
        printfulClient = new Printful(config.PRINTFUL_KEY);

    if (!cartItems) {
      CartItem.objects.find().where({ user: this.id, isArchived: false }).populate('product').then(function(cartItems) {
        // this assumes all cart items are using printful and a quantity of 1
        _.each(cartItems, function(cartItem) { requestBody.items.push({ variant_id: cartItem.product.externalId, quantity: 1 }); });
        requestBody.recipient.country_code = location.countryCode;
        if (location.stateCode) requestBody.recipient.state_code = location.stateCode;
        if (location.zipCode) requestBody.recipient.zip = location.zipCode;

        return new Bluebird(function(resolve, reject) {
          printfulClient.post('shipping/rates?expedited=1', requestBody).success(resolve).error(reject);
        });
      });
    } else {
      // this assumes all cart items are using printful and a quantity of 1
      _.each(cartItems, function(cartItem) { requestBody.items.push({ variant_id: cartItem.product.externalId, quantity: 1 }); });
      requestBody.recipient.country_code = location.countryCode;
      if (location.stateCode) requestBody.recipient.state_code = location.stateCode;
      if (location.zipCode) requestBody.recipient.zip = location.zipCode;

      return new Bluebird(function(resolve, reject) {
        printfulClient.post('shipping/rates?expedited=1', requestBody).success(resolve).error(reject);
      });
    }
  },

  getBucketUrl: function() {
    return config.s3BucketName + '/' + this.getBucketDir();
  },

  getBucketDir: function() {
    return 'users/' + this.id + '/uploads';
  },

  getFullName: function() {
    if (!this.firstName && !this.lastName) return '';
    if (this.firstName && !this.lastName) return this.firstName;
    if (!this.firstName && this.lastName) return this.lastName;
    return this.firstName + ' ' + this.lastName;
  },

  getActivationLink: function() {
    return config.domain + Helpers.apiPath('user') + '/' + this.id + '/activate/' + this.activationToken;
  },

  /* This method is called before sending the user data back to the client. */
  toJSON: function() {
    var obj = _.clone(this.toObject());

    obj.fullName = this.getFullName();

    obj.cartItems = _.map(this.cartItems, function(ci) { return typeof ci === 'object' ? ci.toJSON() : ci; });
    if (typeof this.userSettings === 'object') obj.userSettings = this.userSettings.toJSON();

    // remove sensitive information
    delete obj.password;
    delete obj.isAdmin;
    delete obj.activationToken;
    delete obj.resetToken;
    delete obj.creditCards;
    delete obj.braintreeId;
    delete obj.lastLoginIp;
    delete obj.confirmedTerms;

    return obj;
  }

};

/* Lifecycle callsback for the User model. */
var LifecycleCallbacks = {

  beforeCreate: function(values, next) {
    values.dateJoined = new Date();
    values.activationToken = crypto.randomBytes(15).toString('hex');

    hashPassword(values.password, function(err, hash) {
      if (err) return next(err);
      values.password = hash;
      next();
    });
  },

  beforeUpdate: function(values, next) {
    if (typeof values.password !== 'undefined') {
      hashPassword(values.password, function(err, hash) {
        if (err) return next(err);
        values.password = hash;
        next();
      });
    } else {
      next();
    }
  },

  afterCreate: function(user, next) {
    var userSettingsId, braintreeId;

    // create a usersettings model for this user
    UserSettings.objects.create({ user: user.id }).then(function(created) {
      if (!created) return next(err);

      userSettingsId = created.id;

      // create the user on braintree
      return new Bluebird(function(resolve, reject) {
        paymentGateway.customer.create({
          email: user.email
        }, function(err, result) {
          if (err) return reject(err);
          if (!result.success) return reject();

          braintreeId = result.customer.id;
          resolve();
        });
      });
    }).then(function() {
      user.userSettings = userSettingsId;
      user.braintreeId = braintreeId;
      return User.objects.update(user.id, { userSettings: userSettingsId, braintreeId: braintreeId });
    }).then(function() {
      next();
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error(err), { errorName: 'ModelError:User' });
    });
  }

};

/* Create the Waterline.Collection */
var User = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'user',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

/* Hashes the raw text password */
var hashPassword = function(password, done) {
  bcrypt.hash(password, 10, done);
};

module.exports = User;