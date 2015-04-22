/*jslint node: true */
/* global Promise */
'use strict';

var mock_cache = function(name) {
  this.name = name;
  this.content = {};
};

mock_cache.prototype = {
  put: function(req, res) {
    this.content[req.url] = res;
    return Promise.resolve();
  },
  addAll: function(urls) {
    return Promise.resolve();
  }
};

module.exports = mock_cache;
