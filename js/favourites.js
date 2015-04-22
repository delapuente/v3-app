
(function () {
  'use strict';

  var $ = document.querySelector.bind(document);
  var isCached = $('meta[cached]');
  var favouriteList = $('ul');
  var favouriteTemplate = favouriteList.removeChild($('li'));

  if (!isCached) {
    renderFavourites();
  }

  function renderFavourites() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/favourites');
    xhr.responseType = 'json';
    xhr.onload = function () {
      fillDOM(xhr.response);
    };
    xhr.send();
  }

  function fillDOM(collection) {
    favouriteList.innerHTML = '';
    var buffer = document.createDocumentFragment();

    collection.forEach(function (favourite) {
      buffer.appendChild(newMovieEntry(favourite));
    });
    favouriteList.appendChild(buffer);
  }

  function newMovieEntry(movie) {
    var template = favouriteTemplate.cloneNode(true);
    template.id = movie.imdbID;
    template.$ = template.querySelector.bind(template);
    template.$('a').href = '/movie.html?id=' + movie.imdbID;
    template.$('h2').textContent = movie.Title + ' (' + movie.Year + ')';
    return template;
  }
}());
