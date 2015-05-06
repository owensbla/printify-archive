module.exports = {

  parseErrorResponse: function(resp) {
    try {
      var messageString = '',
          errorResp, errorMessage;

      errorResp = JSON.parse(resp.responseText);

      if (_.has(errorResp, 'error')) {
        errorMessage = errorResp.error;
      } else if (_.has(errorResp, 'errors')) {
        errorMessage = errorResp.errors;
      } else {
        messageString = 'Sorry! We ran in to an error. If this problem persists, please contact support@printify.io.';
      }

      if (_.isArray(errorMessage)) {
        messageString = 'We ran in to a few errors when trying to save this: ';
        _.each(errorMessage, function(message) {
          messageString = messageString + message + '.<br>';
        }); 
      } else {
        messageString = errorMessage;
      }

      return messageString;
    } catch(err) {
      return 'Sorry! We ran in to an error. If this problem persists, please contact support@printify.io.';
    }
  }

};