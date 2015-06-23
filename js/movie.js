
(function () {
  'use strict';

  var $ = document.querySelector.bind(document);

  // I'm going to read this meta header when the view comes from RenderCache
  // on purpose. I'm the one who is setting this mark as well. See
  var isCached = $('meta[cached]');
  var isFavourite = $('input[name="is-favourite"]');

  if (!isCached) {
    var id = parameters().id;
    getAndRenderMovie(id);
  }
  else {
    setupInteraction(model);
  }

  function getAndRenderMovie(movieId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/movies/' + movieId);
    xhr.responseType = 'json';
    xhr.onload = function () {
      var model = window.model = xhr.response;
      fillDOM(model);
      addToRenderCache(model);
      setupInteraction(model);
    };

    // This is the hard work because it involves a query to the model
    // (which is actually a network request bypassing CORS with a proxy!)
    xhr.send();
  }

  function fillDOM(model) {
    $('img').src = CORS + model.Poster;
    $('h1').textContent = model.Title + ' (' + model.Year + ')';
    $('title').textContent = $('h1').textContent;
    $('#genre').textContent = model.Genre;
    $('#director').textContent = model.Director;
    $('#actors').textContent = model.Actors;
    $('#plot').textContent = model.Plot;
  }

  function addToRenderCache(model) {
    serializeModel(model);
    markAsRender();

    // This outerHTML could be huge. Send to a worker ASAP.
    var renderedContent = document.documentElement.outerHTML;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', window.location);
    xhr.setRequestHeader('Content-Type', 'text/html');
    xhr.send(renderedContent);
  }

  function serializeModel(model) {
    var serialized = JSON.stringify(model);
    var script = document.createElement('SCRIPT');
    script.textContent = 'window.model=' + serialized;
    $('head').insertBefore(script, $('head').firstChild);
  }

  function markAsRender() {
    var cacheMark = document.createElement('META');
    cacheMark.setAttribute('cached', 'cached');
    $('head').appendChild(cacheMark);
  }

  function setupInteraction(model) {
    isFavourite.onclick = function () {
      var url = '/api/favourites/' + model.imdbID;
      var content, method;
      if (isFavourite.checked) {
        method = 'PUT';
        content = JSON.stringify(model);
      }
      else {
        method = 'DELETE';
        content = undefined;
      }
      favPage(isFavourite.checked);
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.send(content);
    };
    setTimeout(checkIsFavourite.bind(this, model));
  }

  function favPage(isFavourite) {
    $('body').classList[isFavourite ? 'add' : 'remove']('fav');
  }

  function checkIsFavourite(model) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/favourites/' + model.imdbID);
    xhr.onload = function () {
      isFavourite.disabled = false;
      isFavourite.checked = xhr.status !== 404;
      favPage(isFavourite.checked);
    };
    xhr.send();
  };

  function parameters() {
    var params = window.location.search.substr(1);
    return params.split('&').reduce(function (dict, pair) {
      var tuple = pair.split('=');
      dict[tuple[0]] = tuple[1];
      return dict;
    }, {});
  }
}());
