var later = require('later'),

    // Jobs
    UpdatePrintfulOrders = require('./updatePrintfulOrders');

var runJobs = function() {
  // Fetch and Update Printful Orders
  var updatePrintfulOrdersTimer = 1000 * 60 * 60,
      updateOrders;
  updateOrders = setInterval(function() { new UpdatePrintfulOrders(); }, updatePrintfulOrdersTimer);
};

runJobs();

module.exports = {};