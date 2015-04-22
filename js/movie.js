
(function () {
  'use strict';

  var $ = document.querySelector.bind(document);
  var isCached = $('meta[cached]');
  var isFavourite = $('input[name="is-favourite"]');
  var model;

  if (!isCached) {
    var id = parameters().id;
    renderMovie(id);
  }

  setupInteraction();

  function renderMovie(movieId) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/movies/' + movieId);
    xhr.responseType = 'json';
    xhr.onload = function () {
      model = xhr.response;
      fillDOM(model);
    };
    xhr.send();
  }

  function fillDOM(model) {
    $('img').src = model.Poster;
    $('h1').textContent = model.Title + ' (' + model.Year + ')';
    $('title').textContent = $('h1').textContent;
    $('#genre').textContent = model.Genre;
    $('#director').textContent = model.Director;
    $('#actors').textContent = model.Actors;
    $('#plot').textContent = model.Plot;
  }

  function setupInteraction() {
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
    setTimeout(checkIsFavourite);
  }

  function favPage(isFavourite) {
    $('body').classList[isFavourite ? 'add' : 'remove']('fav');
  }

  function checkIsFavourite() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/favourites/' + parameters().id);
    xhr.onload = function () {
      isFavourite.disabled = false;
      isFavourite.checked = xhr.status >= 200 && xhr.status < 300;
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
