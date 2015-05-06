var express = require('express'),
    app = express(),
    Bluebird = require('bluebird');

new Bluebird(function(resolve, reject) {
  // initialize configs
  require('./lib/config/initializers');

  // express config
  require('./lib/config/express')(app);

  // Passport Configuration
  require('./lib/config/passport');

  var config = require('./lib/config/env'),
      git = require('git-rev');

  // set config.VERSION using the current git-rev
  resolve(new Bluebird(function(resolve, reject) {
    var config = require('./lib/config/env'),
      git = require('git-rev');

    git.tag(function(tag) { config.VERSION = tag; resolve(); });
  }));
}).then(function() {
  // initialize middleware
  require('./lib/config/middleware')(app);

  // setup routes
  require('./lib/routes')(app);

  // start da app
  require('./lib/config/database')(function() {

    app.listen(app.get('port'), function() {
      console.log('Server listening on port %d in %s mode', app.get('port'), app.get('env'));
    });

  });

  // run background tasks with later
  require('./lib/jobs');
});



module.exports = app;