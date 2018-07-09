## Introduction

enhance the ability of service worker.


## sw.js example

```js
importScripts('./sw-core.js');

sw.config({
  cacheId: 'cachedb',
  precache: [
  	'./images/test.png',
  	'https://gw.alipayobjects.com/zos/rmsportal/CtJlgAZbmyeSCLxqsgqF.png'
  ],
}).run();
```

## Options

**cacheId** `String`

**default** `cachedb`

cache name.

<br/>

**precache** `Array`

**default** `[]`

pre-cached list.

<br/>

**urlRule** `RegRex`

**default** `/https?:\/\/.+\.(jpg|gif|png|jpeg|webp|js|css)$/`

the URL rules will be cached.

<br/>

**requestErr** `Function`

**default** `noop`

when the request is error, the callback will be triggered.

<br/>

**exceedQuotaErr** `Function`

**default** `noop`

when the quota isn't enough, trigger the function of exceedQuotaErr.

<br/>

trigger the function of exceedQuotaErr

**patchjs.increment** `Boolean`

**default** `true`

It enables the incremental load.

<br/>

**patchjs.urlRule** `RegRex`

**default** `/\d+\.\d+\.\d+\/.+\.(css|js)$/`

the URL rules will be cached by Patch.js.

<br/>
