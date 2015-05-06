var express = require('express'),
    config = require('./env'),

    // middleware
    expressValidator = require('express-validator'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    compression = require('compression'),
    serveStatic = require('serve-static'),
    responseTime = require('response-time'),
    session = require('express-session'),
    passport = require('passport'),
    exphbs = require('express-handlebars'),
    session = require('express-session'),
    SessionStore = require('express-mysql-session'),
    bugsnag = require('bugsnag');

bugsnag.register(config.BUGSNAG_API_KEY, {
  releaseStage: config.env,
  notifyReleaseStages: ['production', 'staging', 'development'],
  appVersion: config.VERSION
});

module.exports = function(app) {

  // setup view engine
  var hbs = exphbs.create({
    defaultLayout: 'base',
    extname: '.hbs',
    layoutsDir: config.root + '/lib/templates/layouts/',
    partialsDir: config.root + '/lib/templates/partials/'
  });
  app.engine('hbs', hbs.engine);
  app.set('view engine', 'hbs');
  app.set('views', config.root + '/lib/templates/layouts/');

  // session
  app.use(session({
    name: '_printify.io',
    secret: config.SALT,
    store: new SessionStore({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database
    }),
    resave: true,
    saveUninitialized: true
  }));

  // bugsnag
  app.use(bugsnag.requestHandler);
  app.use(bugsnag.errorHandler);

  // serve-static
  // if (config.env === 'development') {
    app.use(serveStatic(config.root + '/build', {}));
  // }

  // cookie-parser
  app.use(cookieParser());

  // body-parser
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(multer({ inMemory: true }));

  // sessions
  app.use(session({
    secret: 'SECRET',
    saveUninitialized: true,
    resave: true
  }));

  // passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // compression
  app.use(compression());

  // express-validator
  app.use(expressValidator());

  // morgan (logging)
  app.use(function(req, res, next) {
    if (req.url === '/ping') return next();
    var logger = morgan('dev');
    logger(req, res, next);
  });

  // response-time
  app.use(responseTime());

};