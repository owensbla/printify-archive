var path = require('path'),
    rootPath = path.normalize(__dirname + '/../../..');

module.exports = {
  aws: require('../aws.json'),

  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/tiff'
  ],

   // 'application/pdf', 'image/svg+xml', 'image/pjpeg',
   //  'image/gif', 'image/photoshop', 'image/x-photoshop', 'image/psd', 'application/photoshop',
   //  'application/psd', 'zz-application/zz-winassoc-psd', 'application/octet-stream'

  BASE_PRICE_MARKUP: 1.0,

  TAXABLE_STATES: {
    CA: 0.075,
    IL: 0.0775
  },

  maxFileSize: 52428800, // 50MB

  requireActivation: false,
  
  root: rootPath,
  port: process.env.PORT || 1337
};