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

**patchjs.increment** `Boolean`

**default** `true`

It enables the incremental load.

<br/>

**patchjs.urlRule** `RegRex`

**default** `/\d+\.\d+\.\d+\/(common|index)\.(css|js)$/`

the URL rules will be cached by Patch.js.

<br/>
