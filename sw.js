
importScripts('node_modules/serviceworkers-ware/dist/sww.js');
importScripts('js/simpleStore.js');

var worker = new ServiceWorkerWare();

worker.get('/api/movies/.*', function (request) {
  var pathName = new URL(request.url).pathname;
  var id = pathName.substr(12);
  var cors = 'http://crossorigin.me/';
  return fetch(cors + 'http://www.omdbapi.com?plot=full&i=' + id);
});

worker.get('/api/favourites$', function () {
  var options = { headers: { 'Content-Type': 'application/json' } };
  return simpleStore.getRaw('favourites')
  .then(function (favourites) {
    favourites = favourites || "[]";
    return new Response(favourites, options);
  });
});

worker.put('/api/favourites/.+', function (request) {
  return request.clone().json()
  .then(storeMovieAsFavourite);

  function storeMovieAsFavourite(movie) {
    return simpleStore.get('favourites')
    .then(function (favouriteList) {
      favouriteList = favouriteList || [];
      var found = findIndex(favouriteList, movie.imdbID) >= 0;
      !found && favouriteList.push(movie);
      return favouriteList;
    })
    .then(function (favouriteList) {
      return simpleStore.set('favourites', favouriteList);
    })
    .then(function () {
      return new Response({ status: 201 });
    });
  }
});

worker.delete('/api/favourites/.+', function (request) {
  var pathName = new URL(request.url).pathname;
  var id = pathName.substr(16);
  return findAndRemoveFavourite(id);

  function findAndRemoveFavourite(id) {
    return simpleStore.get('favourites')
    .then(function (favouriteList) {
      var target = findIndex(favouriteList, id);
      if (target >= 0) { favouriteList.splice(target, 1); }
      return favouriteList;
    })
    .then(function (favouriteList) {
      return simpleStore.set('favourites', favouriteList);
    })
    .then(function () {
      return new Response({ status: 204 });
    });
  }
});

worker.get('/api/favourites/.+', function (request) {
  var pathName = new URL(request.url).pathname;
  var id = pathName.substr(16);
  return findMovie(id);

  function findMovie(id) {
    return simpleStore.get('favourites')
    .then(function (favouriteList) {
      favouriteList = favouriteList || [];
      return favouriteList[findIndex(favouriteList, id)];
    })
    .then(function (movie) {
      var found = !!movie;
      var body = found ? JSON.stringify(movie) : undefined;
      var options = {
        headers: { 'Content-Type': 'application/json' },
        status: found ? 200 : 404
      };
      return new Response(body, options);
    });
  }
});

function findIndex(favourites, id) {
  for (var i = 0, fav; fav = favourites[i]; i++) {
    if (fav.imdbID === id) { break; }
  }
  return i === favourites.length ? -1 : i;
}

worker.init();
