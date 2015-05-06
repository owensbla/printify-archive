var _ = require('lodash'),
    config = require('../config/env'),
    Mailer = require('./'),
    MailchimpApi = require('mailchimp-api/mailchimp'),
    mailchimpClient = new MailchimpApi.Mailchimp(config.MAILCHIMP_KEY),
    Bluebird = require('bluebird'),
    bugsnag = require('bugsnag');

module.exports = {

  subscribeToMailchimp: function(user) {
    var mergeVars = {
      FNAME: user.firstName,
      LNAME: user.lastName
    };

    if (config.env !== 'development') mergeVars.optin_ip = user.lastLoginIp;

    mailchimpClient.lists.subscribe({
      id: config.MAILCHIMP_LIST_ID,
      email: {
        email: user.email
      },
      merge_vars: mergeVars,
      double_optin: false
    },
    function() {}, //success
    function(err) {
      console.trace(err);
      bugsnag.notify(new Error('Failed to subscribe user ' + user.id + ' to Mailchimp: ' + err.error), { errorName: 'MailerError' });
    });
  },

  unsubscribeFromMailchimp: function(user) {
    mailchimpClient.lists.unsubscribe({
      id: config.MAILCHIMP_LIST_ID,
      email: {
        email: user.email
      },
      send_goodbye: false
    },
    function() {}, //success
    function(err) {
      console.trace(err);
      bugsnag.notify(new Error('Failed to unsubscribe user ' + user.id + ' from Mailchimp: ' + err.error), { errorName: 'MailerError' });
    });
  },

  sendActivateEmail: function(context, err, next) {
    next = next ? next : function() {};
    err = err ? err : function() {};

    var template = Mailer.getTemplates('account/activate'),
        user = context.user,
        opts;

    context.activationLink = user.getActivationLink();

    opts = {
      html: template.html(context),
      text: template.text(context),
      subject: 'Activate',
      from_email: 'welcome@printify.io',
      from_name: 'Printify',
      to: [{
        email: user.email,
        name: user.fullName,
        type: 'to'
      }],
      tags: ['activation'],
      google_analytics_campaign: 'activation'
    };

    Mailer.send(opts, err, next);
  },

  sendWelcomeEmail: function(user) {
    var expiresAt = new Date(),
        opts;

    expiresAt.setTime(expiresAt.getTime() + 7 * 86400000);

    user.generatePromoCode({
      discount: '5',
      discountType: 'percent',
      prefix: 'HELLO',
      expirationDate: expiresAt
    }).then(function(promoCode) {
      opts = {
        template_name: 'welcome',
        template_content: [],
        message: {
          important: true,
          to: [{
            email: user.email,
            name: user.getFullName(),
            type: 'to'
          }],
          tags: ['welcome', 'acquisition'],
          google_analytics_campaign: 'welcome',
          merge_vars: [
            {
              rcpt: user.email,
              vars: [
                { name: 'FNAME', content: user.firstName },
                { name: 'LNAME', content: user.lastName },
                { name: 'PROMO', content: promoCode.code },
              ]
            }
          ]
        }
      };

      Mailer.sendTemplate(opts);

      return true;
    }).catch(function(err) {
      console.trace(err);
      bugsnag.notify(new Error('Failed to send welcome email to ' + user.email + ': ' + JSON.stringify(err)), { errorName: 'MailerError'});
    });

  }

};