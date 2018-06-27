// utils
var utils = {};
utils.withinCertainDiffRange = function (localVersion, version, diffCount) {
  if (localVersion) {
    var reg = /(\d+)\.(\d+)\.(\d+)/;
    var versionArray = version.match(reg);
    var localVersionArray = localVersion.match(reg);
    if (versionArray[1] === localVersionArray[1] && versionArray[2] === localVersionArray[2] && versionArray[3] - localVersionArray[3] > 0 && versionArray[3] - localVersionArray[3] < diffCount) {
      return true;
    }
  }
  return false;
};

utils.combineReqUrl = function (url, increment, localVersion) {
  if (increment && localVersion) {
    var extName = url.substring(url.lastIndexOf('.'));
    url = url.replace(new RegExp(extName + '$', 'i'), '-' + localVersion + extName);
  }
  return url;
};

utils.mergeCode = function (source, chunkSize, diffCodeArray) {
  var jsCode = '';
  for (var i = 0, len = diffCodeArray.length; i < len; i++) {
    var code = diffCodeArray[i];
    if (Object.prototype.toString.call(code) === '[object String]') {
      jsCode += code;
    } else {
      var start = code[0] * chunkSize;
      var end = code[1] * chunkSize;
      jsCode += source.substr(start, end);
    }
  }
  return jsCode;
};

utils.clone = function (dest, src) {
  for (var p in src) {
    if (src.hasOwnProperty(p) && src[p]) {
      if (Object.prototype.toString.call(src[p]) === '[object Object]') {
        utils.clone(dest[p], src[p]);
      } else {
        dest[p] = src[p];
      }
    }
  }
};

var contentTypeMapping = {
  'js': 'application/x-javascript',
  'css': 'text/css'
};

function noop () {}

// service worker parts
var globalConfig = {
  cacheId: 'cachedb',
  urlRule: /https?:\/\/.+\.(jpg|gif|png|jpeg|webp|js|css)$/,
  patchjs: {
    increment: true,
    urlRule: /\d+\.\d+\.\d+\/(common|index)\.(css|js)$/
  },
  precache: [],
  networkErr: noop,
  exceedQuotaErr: noop
};

function customFetch (url) {
  var diffVersionReg = /-\d+\.\d+\.\d+/;
  var isDiffReq = diffVersionReg.test(url);
  return fetch(url).then(function (response) {
    if (response.status === 200 || response.status === 304) {
      if (isDiffReq) {
        return response.text().then(function (value) {
          return {
            value: value,
            isDiffReq: isDiffReq
          };
        });
      } else {
        return response.text();
      }
    } else if (response.status === 404) {
      if (isDiffReq) {
        customFetch(url.replace(diffVersionReg, ''));
      } else {
        return Promise.reject(new Error('Not Found'));
      }
    }
  }).catch(function (error) {
    globalConfig.networkErr(error);
  });
};

function installEventListener (event) {
  event.waitUntil(
    caches.open(globalConfig.cacheId).then(function (cache) {
      return cache.addAll(globalConfig.precache);
    })
  );
};

function activateEventListener (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== globalConfig.cacheId) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
};

function fetchEventListener (event) {
  var url = event.request.url;
  var patchjsConfig = globalConfig.patchjs;
  if (patchjsConfig.increment && patchjsConfig.urlRule.test(url)) {
    // patchjs cache
    var result = url.match(/\d+\.\d+\.\d+/g);
    var version = result[result.length - 1];
    var cacheUrl = url.replace(/\d+\.\d+\.\d+\//, '');
    var extName = url.substring(url.lastIndexOf('.') + 1);
    var finalResponse = caches.match(cacheUrl).then(function (cache) {
      if (!cache) {
        return customFetch(url).then(function (value) {
          caches.open(globalConfig.cacheId).then(function (cache) {
            cache.put(new Request(cacheUrl), new Response(JSON.stringify({
              code: value,
              version: version
            }), {
              'status': 200
            })).catch(function (error) {
              globalConfig.exceedQuotaErr(error);
            });
          });
          return new Response(value, {
            'status': 200,
            'headers': {
              'Content-Type': contentTypeMapping[extName]
            }
          });
        });
      }
      return cache.text().then(function (cacheValue) {
        var item = JSON.parse(cacheValue) || {};
        var assetsCode = item.code;
        if (item.version === version && assetsCode) {
          return new Response(assetsCode, {
            'status': 200,
            'headers': {
              'Content-Type': contentTypeMapping[extName]
            }
          });
        } else {
          var increment = item.code && utils.withinCertainDiffRange(item.version, version, 5);
          var diffUrl = utils.combineReqUrl(url, increment, item.version);
          return customFetch(diffUrl).then(function (result) {
            if (result) {
              if (result.isDiffReq) {
                var diffData = JSON.parse(result.value);
                assetsCode = diffData.m ? utils.mergeCode(assetsCode, diffData.l, diffData.c) : assetsCode;
              } else {
                assetsCode = result;
              }
              caches.open(globalConfig.cacheId).then(function (cache) {
                cache.put(new Request(cacheUrl), new Response(JSON.stringify({
                  code: assetsCode,
                  version: version
                }), {
                  'status': 200
                })).catch(function (error) {
                  globalConfig.exceedQuotaErr(error);
                });
              });
            }
            return new Response(assetsCode, {
              'status': 200,
              'headers': {
                'Content-Type': contentTypeMapping[extName]
              }
            });
          });
        }
      });
    });
    event.respondWith(finalResponse);
  } else if (globalConfig.urlRule.test(url)) {
    // cache fisrt
    event.respondWith(
      caches.match(event.request).then(function (cache) {
        return cache || fetch(event.request).then(function (response) {
          caches.open(globalConfig.cacheId).then(function (cache) {
            cache.put(event.request, response).catch(function (error) {
              globalConfig.exceedQuotaErr(error);
            });
          });
          return response.clone();
        }).catch(function (error) {
          globalConfig.networkErr(error);
        });
      })
    );
  } else {
    // networkonly
    event.respondWith(
      caches.match(event.request).then(function (cache) {
        return cache || fetch(event.request).catch(function (error) {
          globalConfig.networkErr(error);
        });
      })
    );
  }
};

var sw = {};

sw.config = function (options) {
  utils.clone(globalConfig, options);
  return this;
};

sw.run = function () {
  self.addEventListener('install', installEventListener);
  self.addEventListener('activate', activateEventListener);
  self.addEventListener('fetch', fetchEventListener);
};
