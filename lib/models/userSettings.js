/**
 * UserSettings Model
 *
 * Various user settings.
 */

var config = require('../config/env'),
    _ = require('lodash'),
    Waterline = require('waterline');

/* Attributes (fields on the user model) */
var Attributes = {

  user: {
    model: 'user',
    required: true
  }

};

/* Custom methods on the user model. */
var InstanceMethods = {

  toJSON: function() {
    var obj = _.clone(this.toObject());

    return obj;
  },

};

/* Lifecycle callsback for the User model. */
var LifecycleCallbacks = {

};

/* Create the Waterline.Collection */
var UserSettings = Waterline.Collection.extend(_.merge({
  
  connection: config.database.defaultAdapter,
  identity: 'usersettings',

  attributes: _.merge(Attributes, InstanceMethods),

  fields: _.clone(Attributes)

}, LifecycleCallbacks));

module.exports = UserSettings;