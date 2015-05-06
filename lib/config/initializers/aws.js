var AWS = require('aws-sdk'),
    config = require('../env');

AWS.config.loadFromPath(config.root + '/lib/config/aws.json');