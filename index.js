(function () {
  'use strict';

  // XXX: Registering the SW
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
  .then(console.log.bind(console, 'SW registered!'))
  .catch(console.error.bind(console, 'Registration failed!'));

  var $ = document.querySelector.bind(document);
  var searchBox = $('input');
  var movieList = $('ul');
  var noMovies = $('#no-movies-message');
  var movieTemplate = movieList.removeChild($('li'));
  var spinner = $('#spinner');
  var lastXHR;

  searchBox.oninput = function () {
    lastXHR && lastXHR.abort();

    var title = searchBox.value.trim();
    var cors = 'http://crossorigin.me/'; //XXX: to bypass CORS
    var query = cors + 'http://www.omdbapi.com/?s=' +
                (title ? title + '*' : '');

    var xhr = lastXHR = new XMLHttpRequest();
    xhr.open('GET', query);
    xhr.responseType = 'json';
    xhr.onload = function () {
      spinner.setAttribute('hidden', 'hidden');
      refreshFilmList(xhr.response);
    };
    xhr.send();

    spinner.removeAttribute('hidden');
  };

  function refreshFilmList(response) {
    movieList.innerHTML = '';
    if (!response || response.Error) {
      noMovies.removeAttribute('hidden');
      return;
    }
    else { noMovies.setAttribute('hidden', 'hidden'); }

    var list = response.Search;
    var buffer = document.createDocumentFragment();
    list.forEach(function (movie) {
      buffer.appendChild(newMovieEntry(movie));
    });
    movieList.appendChild(buffer);
  }

  function newMovieEntry(movie) {
    var template = movieTemplate.cloneNode(true);
    template.id = movie.imdbID;
    template.querySelector('a').href = '/movies/' + movie.imdbID;
    template.querySelector('h2').textContent =
      movie.Title + ' (' + movie.Year + ')';
    return template;
  }
}());
