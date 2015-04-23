/*jslint node: true */
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = require('chai').assert;
var sinon = require('sinon');

chai.use(chaiAsPromised);

var mock_caches = require('./mocks/mock_caches.js');
var mock_cache = require('./mocks/mock_cache.js');
var mock_request = require('./mocks/mock_request.js');
var mock_response = require('./mocks/mock_response.js');
global.caches = null;
global.Request = null;
global.Response = null;

suite('CacheHelper', function() {
  var subject = null;


  setup(function() {
    var cache = new mock_cache(subject.defaultCacheName);
    // Always recreate the default cache
    global.caches._caches[subject.defaultCacheName] = cache;
  });

  suiteSetup(function() {
    global.caches = mock_caches;
    global.Request = mock_request;
    global.Response = mock_response;
    var CacheHelper = require('../../lib/cachehelper.js');
    subject = CacheHelper;
  });

  suiteTeardown(function() {
    delete global.caches;
    delete global.Request;
    delete global.Response;
  });

  suite('Retrieving caches', function() {
    test('> get default cache', function(done) {
      subject.getDefaultCache().then(function(cache) {
        assert.ok(cache);
        assert.strictEqual(cache.name, subject.defaultCacheName);
      }).then(done, done);
    });

    test('> getting an unkonwn cache', function(done) {
      subject.getCache('unknown').then(function(cache) {
        assert.notOk(cache);
      }).then(done, done);
    });
  });

  suite('Add all', function() {
    test('> addAll working with polyfill', function(done) {
      sinon.stub(subject, 'fetchAndCache', function(req, cache) {
        cache.content[req.url] = req.url;
        return Promise.resolve();
      });
      subject.getDefaultCache().then(function(cache) {
        cache.addAll = undefined;
        return subject.addAll(cache, ['http://www.example.com',
        'http://www.mozilla.org']);
      }).then(function() {
        return subject.getDefaultCache();
      }).then(function(cache) {
        assert.ok(cache);
        sinon.assert.calledTwice(subject.fetchAndCache);
        assert.ok(cache.content['http://www.example.com']);
        assert.ok(cache.content['http://www.mozilla.org']);
      }).then(function() {
        subject.fetchAndCache.restore();
      }).then(done, done);
    });
  });

  suite('Fetch and Cache', function() {
    var url = 'http://www.example.com';
    var content = 'my content';
    suiteSetup(function() {
      global.fetch = function(){};
    });
    suiteTeardown(function() {
      delete global.fetch;
    });
    test('> fetch and cache url', function(done) {
      sinon.stub(global, 'fetch', function(req) {
        var response = new Response(req.url, content, 200);
        return Promise.resolve(response);
      });

      subject.getDefaultCache().then(function(cache) {
        assert.notOk(cache.content[url]);
        return subject.fetchAndCache(new Request(url),
         cache);
      }).then(function() {
        return subject.getDefaultCache();
      }).then(function(cache) {
        sinon.assert.calledOnce(global.fetch);
        assert.ok(cache.content[url]);
        assert.strictEqual(cache.content[url].content, content);
      }).then(function() {
        fetch.restore();
      }).then(done, done);
    });

    test('> fetch an invalid resource', function(done) {
      sinon.stub(global, 'fetch', function(req) {
        var response = new Response(req.url, content, 401);
        return Promise.resolve(response);
      });

      subject.getDefaultCache().then(function(cache) {
        assert.notOk(cache.content[url]);
        return subject.fetchAndCache(new Request(url),
         cache);
      }).then(function() {
        return subject.getDefaultCache();
      }).then(function(cache) {
        sinon.assert.calledOnce(global.fetch);
        assert.notOk(cache.content[url]);
      }).then(function() {
        fetch.restore();
      }).then(done, done);
    });
  });
});
