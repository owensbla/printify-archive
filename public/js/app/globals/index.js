var TemplateHelpers = require('../helpers/templateHelpers');

var Globals = {

  API_VERSION: '1',

  App: {

    Modal: require('../../lib/dinghy.modal'),

    Templates: TemplateHelpers.loadTemplates()

  },

  CONTENT_ELEMENT: '[data-component="content"]',
  TOPBAR_ELEMENT: '[data-component="topbar"]',
  FOOTER_ELEMENT: '[data-component="footer"]',

};

Globals.API_PATH = '/api/v' + Globals.API_VERSION + '/';

module.exports = Globals;