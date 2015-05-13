(function (global) {
  'use strict';

  var update = {
    add: ['movie.html', 'css/style.css']
  };

  var restore = {
    remove: ['movie.html', 'css/style.css']
  };

  function processUpdate(msg) {
    return Promise.all(Object.keys(msg).map(function (order) {
      return orders[order](msg[order]);
    }));
  }

  var orders = {
    add: function (files) {
      return Promise.all(files.map(function (url) {
        var prefix =
          'http://crossorigin.me/https://rawgit.com/lodr/v3-app/featured/';
        return fetch(prefix + url).then(function (response) {
          return Promise.resolve([response, url]);
        });
      }))
      .then(function (responses) {
        return Promise.all(responses.map(function (response) {
          var actualResponse = response[0];
          var originalUrl = response[1];

          return actualResponse.text().then(function (body) {
            var post = new Request(originalUrl, {
              method: 'POST',
              body: body
            });
            post.headers.set('Content-Type', contentTypeFor(originalUrl));

            return fetch(post);
          });
        }));
      });
    },

    remove: function (files) {
      return Promise.all(files.map(function (url) {
        var post = new Request(url, { method: 'DELETE' });
        return fetch(post);
      }));
    }
  };

  function contentTypeFor(path) {
    var tokens = path.split('.');
    var extension = tokens[tokens.length - 1];
    return {
      'css': 'text/css',
      'html': 'text/html',
      'htm': 'text/html',
      'js': 'application/javascript'
    }[extension];
  }

  global.abTest = {
    start: function () {
      processUpdate(update).then(function () { window.location.reload(); });
    },
    stop: function () {
      processUpdate(restore).then(function () { window.location.reload(); });
    }
  };
}(this))
