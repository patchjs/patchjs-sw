// utils
var utils = {};
utils.withinCertainDiffRange = function (localVersion, version, diffCount) {
  if (localVersion) {
    var reg = /(\d+)\.(\d+)\.(\d+)/;
    var versionArray = version.match(reg);
    var localVersionArray = localVersion.match(reg);
    if (versionArray[1] === localVersionArray[1] && versionArray[2] === localVersionArray[2] && 0 < versionArray[3] - localVersionArray[3] && versionArray[3] - localVersionArray[3] < diffCount) {
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

utils.fetch = function (url) {
  var diffVersionReg = /-\d+\.\d+\.\d+/;
  var isDiffReq = diffVersionReg.test(url);
  return fetch(url).then(function (response) {
    if (response.status === 200 || response.status === 304) {
      if (isDiffReq) {
        return response.text().then(function (value) {
          return {
            value: value,
            isDiffReq: isDiffReq
          }
        });
      } else {
        return response.text();
      }
    } else if (response.status === 404) {
      if(isDiffReq) {
        utils.fetch(url.replace(diffVersionReg, ''));
      } else {
        throw new Error('Not Found');
      }
    }
  })
};

// service worker
var STATIC_VER = 'v1.1';


var cacheFiles = [
  '/',
  '/index.html',
  '/images/test.png',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(STATIC_VER).then(function(cache) {
      return cache.addAll(cacheFiles);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== STATIC_VER) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  if (/\d+\.\d+\.\d+\/.+css|js$/g.test(url)) { // whitelist
    var result = url.match(/\d+\.\d+\.\d+/g);
    var version = result[result.length - 1];
    var cacheUrl = url.replace(/\d+\.\d+\.\d+\//, '');
    var response = caches.match(cacheUrl).then(function (cache) {
      if (!cache) {
        return utils.fetch(url).then(function (value) {
          caches.open('patchjsdb').then(function(cache) {
            cache.put(new Request(cacheUrl), new Response(JSON.stringify({
              code: value,
              version: version
            }), {
              'status': 200
            }));
          });
          return new Response(value, {
            'status': 200
          });
        });
      }
      return cache.text().then(function (cacheValue) {
        var item = JSON.parse(cacheValue) || {};
        var assetsCode = item.code;
        if (item.version === version && assetsCode) {
          return new Response(assetsCode, {
            'status': 200
          });
        } else {
          var increment = item.code && utils.withinCertainDiffRange(item.version, version, 5);
          var diffUrl = utils.combineReqUrl(url, increment, item.version);
          return utils.fetch(diffUrl).then(function (result) {
            if (result.isDiffReq) {
              var diffData = JSON.parse(result.value);
              assetsCode = diffData.m ? utils.mergeCode(assetsCode, diffData.l, diffData.c) : assetsCode;
            } else {
              assetsCode = result.value;
            }
            caches.open('patchjsdb').then(function(cache) {
              cache.put(new Request(cacheUrl), new Response(JSON.stringify({
                code: assetsCode,
                version: version
              }), {
                'status': 200
              }));
            });
            return new Response(assetsCode, {
              'status': 200
            });
          });
        }
      });
    });
    e.respondWith(response);
  } else {
    e.respondWith(
      caches.match(e.request).then(function(cache) {
        return cache || fetch(e.request);
      })
    );
  }
});
