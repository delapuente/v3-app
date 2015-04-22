
self.simpleStore = {
  _name: 'config',

  set: function (key, value) {
    return caches.open(this._name).then(function (db) {
      var request = new Request('http://config/' + key);
      var response = new Response(JSON.stringify(value));
      return db.put(request, response);
    });
  },

  getRaw: function (key) {
    return caches.open(this._name).then(function (db) {
      return db.match('http://config/' + key);
    })
    .then(function (response) {
      if (!response) { return Promise.resolve(null); }
      return response.text();
    });
  },

  get: function (key) {
    return this.getRaw(key).then(JSON.parse.bind(JSON));
  }
};
