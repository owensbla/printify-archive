var _ = require('lodash'),
    config = require('../config/env'),
    Mailer = require('./'),
    MailchimpApi = require('mailchimp-api/mailchimp'),
    mailchimpClient = new MailchimpApi.Mailchimp(config.MAILCHIMP_KEY),
    Bluebird = require('bluebird'),
    bugsnag = require('bugsnag'),
    moment = require('moment');

module.exports = {

  sendOrderCompletedEmail: function(order, user) {
    var opts;
  
    opts = {
      template_name: 'order-complete',
      template_content: [],
      message: {
        important: true,
        to: [{
          email: user.email,
          name: user.getFullName(),
          type: 'to'
        }],
        bcc_address: "blake@printify.io",
        tags: ['revenue', 'order'],
        google_analytics_campaign: 'order',
        merge_vars: [
          {
            rcpt: user.email,
            vars: [
              { name: 'FNAME', content: order.shippingFirstName },
              { name: 'LNAME', content: order.shippingLastName },
              { name: 'ORDER_LINK', content: order.getOrderLink() },
              { name: 'ORDER_ID', content: order.getEncodedId() },
              { name: 'ADDRESS', content: order.getFullShippingAddress() },
              { name: 'CITY', content: order.shippingCity },
              { name: 'STATE', content: order.shippingState },
              { name: 'ZIP', content: order.shippingZipCode },
              { name: 'COUNTRY', content: order.shippingCountry },
              { name: 'DATE', content: moment(order.createdAt).format('MMMM Do, YYYY') },
            ]
          }
        ]
      }
    };

    Mailer.sendTemplate(opts);
  },

  sendOrderShippedEmail: function(order, user) {
    var opts;
    
    opts = {
      template_name: 'order-shipped',
      template_content: [],
      message: {
        important: true,
        to: [{
          email: user.email,
          name: user.getFullName(),
          type: 'to'
        }],
        tags: ['order'],
        google_analytics_campaign: 'order',
        merge_vars: [
          {
            rcpt: user.email,
            vars: [
              { name: 'FNAME', content: order.shippingFirstName },
              { name: 'LNAME', content: order.shippingLastName },
              { name: 'ORDER_LINK', content: order.getOrderLink() },
              { name: 'ORDER_ID', content: order.getEncodedId() },
              { name: 'ADDRESS', content: order.getFullShippingAddress() },
              { name: 'CITY', content: order.shippingCity },
              { name: 'STATE', content: order.shippingState },
              { name: 'ZIP', content: order.shippingZipCode },
              { name: 'COUNTRY', content: order.shippingCountry },
              { name: 'DATE', content: moment(order.createdAt).format('MMMM Do, YYYY') },
            ]
          }
        ]
      }
    };

    Mailer.sendTemplate(opts);
  }

};