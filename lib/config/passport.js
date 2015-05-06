var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('../models/user'),
    paymentGateway = require('../utils/paymentGateway');

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.objects.findOne({ id: id })
  .populate('userSettings')
  .populate('addresses')
  .then(function(user) {
    if (!user) return done('User not found.', null);
    done(null, user);
  }).catch(function(err) {
    done(err, null);
  });
});

// sign in with email and password
passport.use(new LocalStrategy({ usernameField: 'email' }, function(email, password, done) {

  User.objects.findOne({ email: email }).then(function(user) {
    if (!user) return done(null, false, { error: 'The provided email or password is incorrect.' });

    if (user.authenticate(password)) {
      return done(null, user);
    } else {
      return done(null, false, { error: 'The provided email or password is incorrect.' });
    }
  }).catch(function(err) {
    console.error(err);
    return done(err);
  });

}));