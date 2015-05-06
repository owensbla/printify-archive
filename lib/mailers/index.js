var _ = require('lodash'),
    config = require('../config/env'),
    mandrill = require('mandrill-api/mandrill'),
    mailerClient = new mandrill.Mandrill(config.MANDRILL_KEY),
    Handlebars = require('handlebars'),
    fs = require('fs'),
    bugsnag = require('bugsnag');

Mailer = {

  getTemplate: function(path) {
    var template = fs.readFileSync(config.root + '/lib/mailers/templates/' + path, 'utf8');

    return Handlebars.compile(template);
  },

  getTemplates: function(path) {
    return {
      html: this.getTemplate(path + '.hbs'),
      text: this.getTemplate(path +  '.txt')
    };
  },

  send: function(opts, err, success) {
    success = success ? success : function(result) {
      if (result.status === 'rejected' || result.status === 'invalid') {
        bugsnag.notify(new Error('Failed to send welcome email to ' + result.email + ': ' + err.reject_reason), { errorName: 'MailerError'});
      }
    };
    err = err ? err : function(err) {
      bugsnag.notify(new Error(err.message), { errorName: 'MailerError', severity: 'error' });
    };

    _.defaults(opts, {
      track_opens: true,
      track_clicks: true
    });
    
    mailerClient.messages.send({
      async: false,
      message: opts
    }, success, err);
  },

  sendTemplate: function(opts, err, success) {
    success = success ? success : function(result) {
      if (result.status === 'rejected' || result.status === 'invalid') {
        bugsnag.notify(new Error('Failed to send welcome email to ' + result.email + ': ' + err.reject_reason), { errorName: 'MailerError'});
      }
    };
    err = err ? err : function(err) {
      bugsnag.notify(new Error(err.message), { errorName: 'MailerError', severity: 'error' });
    };

    _.defaults(opts, {
      async: false
    });

    _.defaults(opts.message, {
      // headers: {
      //   'X-MC-AutoHtml': 'yes',
      //   'X-MC-AutoText': 'yes'
      // },
      track_opens: true,
      track_clicks: true
    });

    mailerClient.messages.sendTemplate(opts, success, err);
  },

  mailer: mailerClient

};

module.exports = Mailer;