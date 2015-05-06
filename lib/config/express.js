// pull in config
var config = require ('./env');

module.exports = function(app) {
  app.set('port', config.port);
};