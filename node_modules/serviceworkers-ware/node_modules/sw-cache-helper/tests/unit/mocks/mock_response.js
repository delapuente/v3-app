/*jslint node: true*/
'use strict';

var mock_Response = function(url, content, status) {
  this.url = url;
  this.content = content;
  this.status = status;
};

mock_Response.prototype = {
  clone: function() {
    return this;
  }
};

module.exports = mock_Response;
