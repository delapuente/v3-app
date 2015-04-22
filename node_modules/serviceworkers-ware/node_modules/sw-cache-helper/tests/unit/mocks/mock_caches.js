/*jslint node: true */
/* global Map, Promise */
'use strict';

var cache = require('./mock_cache');

var mock_caches = {
  _caches: {},
  open: function(name) {
    return Promise.resolve(this._caches[name]);
  }
};

module.exports = mock_caches;
