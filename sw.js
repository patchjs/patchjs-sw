importScripts('./sw-core.js');
/*
var defaultConfig = {
  cacheId: 'v1.0',
  urlRule: /https?:\/\/.+\.(jpg|gif|png|jpeg|webp|js|css)$/g,
  patchjs: {
    increment: true,
    urlRule: /\d+\.\d+\.\d+\/.+(css|js)$/g
  },
  precache:[]
};
*/

sw.config({
  cacheId: 'cachedb',
  precache: [
  	'./images/test.png',
  	'https://gw.alipayobjects.com/zos/rmsportal/CtJlgAZbmyeSCLxqsgqF.png'
  ],
}).run();
