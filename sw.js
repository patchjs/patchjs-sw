importScripts('./sw-core.js');
/*
var defaultConfig = {
  cacheId: 'cachedb',
  urlRule: /https?:\/\/.+\.(jpg|gif|png|jpeg|webp|js|css)$/,
  patchjs: {
    increment: true,
    urlRule: /\d+\.\d+\.\d+\/(common|index)\.(css|js)$/
  },
  precache: [],
  networkErr: function (error) {},
  exceedQuotaErr: function (error) {}
};
*/

self.onerror = function (event) {
  console.log('error:' + JSON.stringify(event));
  // event.message
  // event.filename
  // event.lineno
  // event.colno
  // event.error.stack
};

self.addEventListener('unhandledrejection', function (event) {
  console.log('unhandledrejection:' + JSON.stringify(event));
  // event.reason
});

sw.config({
  cacheId: 'cachedb',
  precache: [
    './images/test.png',
    'https://gw.alipayobjects.com/zos/rmsportal/CtJlgAZbmyeSCLxqsgqF.png'
  ],
  networkErr: function (error) {
    console.log(error);
  },
  exceedQuotaErr: function (error) {
    console.log(error);
  }
}).run();
