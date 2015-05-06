var extend = require('../utils/extend'),
    config = require('../config/env'),
    _ = require('lodash'),
    Backbone = require('backbone'),
    Job = require('./_job');

var UpdatePrintfulOrdersJob = Job.extend({

  initialize: function() {
    var exec = require('child_process').exec,
        child;

    child = exec('NODE_ENV=' + config.env + ' node ' + config.root + '/lib/tasks/updateOrders.js',
      function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
          console.log(error);
        }
    });
  }

});

module.exports = UpdatePrintfulOrdersJob;