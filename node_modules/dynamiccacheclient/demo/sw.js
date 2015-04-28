importScripts('../bower_components/serviceworkerware/dist/sww.js');
importScripts('../bower_components/dynamiccache/dist/dynamiccache.js');

var worker = new self.ServiceWorkerWare();

worker.use(new DynamicCache('dynamic'));

worker.init();
