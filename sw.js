
importScripts('node_modules/serviceworkers-ware/dist/sww.js');

var worker = new ServiceWorkerWare();

worker.get('/movies/*', function (request, response) {
  var pathName = new URL(request.url).pathname;
  var id = pathName.substr(8);
  var cors = 'http://crossorigin.me/';
  var model = fetch(cors + 'http://www.omdbapi.com?plot=full&i=' + id);
  var template = fetch('/movie.html');

  return Promise.all([template, model])
    .then(getBodies)
    .then(fillTemplate)
    .then(returnMovieResponse);

  function getBodies(templateAndModelResponses) {
    var template = templateAndModelResponses[0].text();
    var model = templateAndModelResponses[1].json();
    return Promise.all([template, model]);
  }

  function fillTemplate(templateAndModel) {
    var template = templateAndModel[0];
    var model = templateAndModel[1];
    var filled = template.replace(/\$(\w+)/g, function (all, property) {
      return model[property];
    });
    return filled;
  }

  function returnMovieResponse(template) {
    var response = new Response(template, { headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }});
    return Promise.resolve(response);
  }
});

worker.init();
