(function () {
  'use strict';

  // XXX: Registering the SW
  if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(console.log.bind(console, 'SW registered!'))
    .then(function () { document.location.reload(); })
    .catch(console.error.bind(console, 'Registration failed!'));
  }
  else { console.log('SW already there!'); }

  var $ = document.querySelector.bind(document);

  var searchBox = $('input');
  var movieList = $('ul');
  var noMovies = $('#no-movies-message');
  var movieTemplate = movieList.removeChild($('li'));
  var spinner = $('#spinner');
  var lastXHR;

  setupInteraction();

  function setupInteraction() {
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
        hideSpinner();
        renderFilmList(xhr.response);
      };
      xhr.send();
      showSpinner();
    };

    $('#start-ab-testing').onclick = abTest.start;
    $('#stop-ab-testing').onclick = abTest.stop;
  }

  function showSpinner() {
    spinner.removeAttribute('hidden');
  }

  function hideSpinner() {
    spinner.setAttribute('hidden', 'hidden');
  }

  function renderFilmList(response) {
    movieList.innerHTML = '';
    if (!response || response.Error) {
      showNoMoviesMessage();
      return;
    }
    else {
      hideNoMoviesMessage();
    }

    var list = response.Search;
    var buffer = document.createDocumentFragment();
    list.forEach(function (movie) {
      buffer.appendChild(newMovieEntry(movie));
    });
    movieList.appendChild(buffer);
  }

  function showNoMoviesMessage() {
    noMovies.removeAttribute('hidden');
  }

  function hideNoMoviesMessage() {
    noMovies.setAttribute('hidden', 'hidden');
  }

  function newMovieEntry(movie) {
    var template = movieTemplate.cloneNode(true);
    template.id = movie.imdbID;
    template.$ = template.querySelector.bind(template);
    template.$('a').href = '/movie.html?id=' + movie.imdbID;
    template.$('h2').textContent = movie.Title + ' (' + movie.Year + ')';
    return template;
  }
}());
