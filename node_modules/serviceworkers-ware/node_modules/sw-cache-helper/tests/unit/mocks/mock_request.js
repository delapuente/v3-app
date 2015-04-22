/*jslint node: true */
'use strict';

var mock_Request = function(url) {
  this.url = url;
};

mock_Request.prototype = {
  clone: function() {
    return this;
  }
};

module.exports = mock_Request;
