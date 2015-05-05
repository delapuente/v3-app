# What's this v3-app?

v3-app is toy movie finder using a service worker's proof of concept implementing some ideas from [Gaia Architectural Proposal](https://wiki.mozilla.org/Gaia/Architecture_Proposal).

## How can I try it?

[Download the master branch](https://github.com/lodr/v3-app/archive/master.zip), decompress locally and serves its contents from `localhost` with a simple [static web server](https://gist.github.com/willurd/5720255):

```bash
$ python3 -m http.server
```

Now with [Chrome Canary](https://www.google.es/chrome/browser/canary.html) or [Firefox Nightly](https://nightly.mozilla.org/) with [E10s disabled](https://wiki.mozilla.org/Electrolysis#Enabling_and_Disabling_Electrolysis) you can browse the application (run in responsive mode because it is quite ugly in wide screens).

## Browsing the code

Code is quite straighforward and the most important parts are the [worker itself](https://github.com/lodr/v3-app/blob/nightly/sw.js) and the code in charge of [rendering the movie details](https://github.com/lodr/v3-app/blob/nightly/js/movie.js) in `movie.js`. The application is using [serviceworkerware](https://github.com/arcturus/serviceworkerware), a framework a-la express.js to ease service workers programming.

### The service worker

#### The render and offline caches

The service worker is following the ideas of [render cache](https://wiki.mozilla.org/Gaia/Architecture_Proposal#Render_store) and [offline cache](https://wiki.mozilla.org/Gaia/Architecture_Proposal#Offline_store). The render cache is in charge of providing already rendered content. It's a type of what we call a [_raw cache_](https://github.com/arcturus/sww-raw-cache) i.e. a cache to hide latencies such as accessing the network or a slow API. In this case we hide not only accessing http://www.omdbapi.com API but the CORS proxy.

```js
// Render Cache
var worker = new ServiceWorkerWare();

// The render cache improves the performance of the most expensive part of
// the app by caching the rendered view for the specific movie.
worker.use('/movie\\.html', new DynamicCache('movies'));
```

As simply as that, the middleware will intercept all requests to `/movie.html` and serve the content inside the `movies` cache if found. If not, it will fall through the next middleware.

After telling your worker to use the render cache, you implement your custom caches. At the end, you tell the worker to use an offline cache: 

```js
// Offline cache
importScripts('/resources.js');
worker.use(new self.StaticCacher(RESOURCES));
worker.use(new self.SimpleOfflineCache());
```

The `StaticCacher` is part of _serviceworkerware_ and will cache the array of resources passed as parameter. Take a look at [resources.js](https://github.com/lodr/v3-app/blob/nightly/resources.js) if you want.

Finally the `SimpleOfflineCache` will serve the content stored from the `StaticCacher`. As we're omitting the route, the middleware got installed for any route. As soon as the `SimpleOfflineCache` middleware try to find a resource in the cache without success, it will go to the network for a version and will cache that version.

#### A _local server_

One of the advantages of using _serviceworkerware_ is you can write server code inside you service worker. Look at this CRUD API for listing, adding, consulting and deleting favourites.

```js
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
```
