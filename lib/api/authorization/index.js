module.exports = {

  isAdmin: function(req, res, next) {
    if (!req.user.isAdmin) return res.redirect('/error/404');
    next();
  },

  User: require('./user.js')
};