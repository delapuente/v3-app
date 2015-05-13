/* global Response, Request, Promise */
'use strict';

var CacheHelper = require('sw-cache-helper');

var DEFAULT_MATCH_OPTIONS = {
  ignoreSearch: false,
  ignoreMethod: false,
  ignoreVary: false
};

/**
 * Constructor for the RawCache object. It receives an object
 * with the configuration parameters.
 * @param {Object} options set of configuration parameters.
 */
function RawCache(options) {
  if (!options.cacheName) {
    throw Error('This middleware needs a cache name.');
  }

  this.cacheName = options.cacheName;
  this.matchOptions = {
    ignoreSearch: options.ignoreSearch || DEFAULT_MATCH_OPTIONS.ignoreSearch,
    ignoreMethod: options.ignoreMethod || DEFAULT_MATCH_OPTIONS.ignoreMethod,
    ignoreVary: options.ignoreVary || DEFAULT_MATCH_OPTIONS.ignoreVary,
  };
  this.DEFAULT_CONTENT_TYPE = options.defaultContentType || 'text/html';
}

/**
 * Utility method to retrieve cache used by this middleware.
 * @returns {Promise} promise once resolved will contain the Cache object
 */
RawCache.prototype._getCache = function getCache() {
  return CacheHelper.getCache(this.cacheName);
};

// This middleware will support the following http methods
RawCache.prototype.SUPPORTED_ACTIONS = ['get', 'post', 'put', 'delete'];

/**
 * Handles the request and perform actions over the cache content
 * based on the http verb used for the request.
 * @param {Request} the request object.
 * @param {Response} the response object.
 */
RawCache.prototype.onFetch = function onFetch(request, response) {
  if (response) {
    return Promise.resolve(response);
  }

  var method = request.method.toLowerCase();
  if (this.SUPPORTED_ACTIONS.indexOf(method) === -1) {
    // Method not supported, just bypass the request and do nothing
    // in this layer
    return null;
  }

  return this.preprocessRequest(request).then(function (request) {
    return this[method].apply(this, [request, response]);
  }.bind(this));
};

/**
 * Preprocess the request taking into account the matching options.
 * @param {Request} the request object.
 */
RawCache.prototype.preprocessRequest = function (request) {
  var clone = request.clone();
  return clone.blob().then(function (body) {
    if (['GET', 'HEAD'].indexOf(request.method) >= 0) {
      body = undefined;
    }
    if (this.matchOptions.ignoreSearch) {
      var url = new URL(request.url);
      url.search = '';
      request = new Request(url.href, {
        method: request.method,
        headers: request.headers,
        body: body,
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache
      });
    }
    //TODO: Implement the rest of match options
    return Promise.resolve(request);
  }.bind(this));
};

/**
 * Get the content from this cache.
 * @param {Request} request the request object.
 * @param {Response} response the response object.
 * @returns {Promise} Promise with the response object cached or null
 */
RawCache.prototype.get = function get(request) {
  var _this = this;
  return this._getCache().then(function(cache) {
    return cache.match(request, _this.matchOptions);
  });
};

/**
 * Removes the specified uri from the cache entry
 * @param {Request} request the request object.
 * @param {Response} response the response object.
 * @returns {Promise} Promise, result of removing from cache.
 */
RawCache.prototype.delete = function del(request) {
  var self = this;
  return this._getCache().then(function(cache) {
    return cache.delete(request).then(self._getOKResponse,
       self._getErrorResponse);
  });
};

/**
 * Removes the specified uri from the cache entry
 * @param {Request} request the request object.
 * @param {Response} response the response object.
 * @returns {Promise} Promise, 200 response if cached correctly.
 */
RawCache.prototype.post = function post(request) {
  var self = this;
  return request.text().then(function(content) {
    var contentType = request.headers.get('Content-Type') ||
     self.DEFAULT_CONTENT_TYPE;
    var response = new Response(content, {
      'headers': {
      	'x-sww-raw-cache': self.cacheName + ';time=' + Date.now(),
      	'Content-Type': contentType
      }
    });
    // We create a new request, with default GET method
    var customRequest = new Request(request.url);
    return self._getCache().then(function(cache) {
      return cache.put(customRequest, response).then(self._getOKResponse,
        self._getErrorResponse);
    });
  });
};

// In this version put and post work in the same way, this could change
// in future versions.
RawCache.prototype.put = RawCache.prototype.post;

/**
 * Builds a 200 response to be returned when operations against the cache
 * are performed without problems.
 * @param (string) msg optional message
 * @returns (Response) response object
 */
RawCache.prototype._getOKResponse = function(msg) {
  var response = {
    status: 'ok'
  };
  if (msg) {
    response.msg = msg;
  }

  return new Response(response, {
    'Content-Type': 'application/json'
  });
};

/**
 * Builds a 500 response to be returned when operations against the cache
 * are performed with problems.
 * @param (string) msg optional message
 * @returns (Response) response object
 */
RawCache.prototype._getErrorResponse = function(msg) {
  var response = {
    status: 'ko'
  };
  if (msg) {
    response.msg = msg;
  }

  return new Response(response, {
    'Content-Type': 'application/json',
    'status': 500
  });
};

module.exports = RawCache;
