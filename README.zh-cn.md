## 介绍

在 service worker 里面实现字符级的文件更新。


## sw.js 样例

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

## 配置项

**cacheId** `String`

**default** `cachedb`

指定唯一的缓存 ID 名称。 

<br/>

**precache** `Array`

**default** `[]`

预加载的静态资源列表。

<br/>

**urlRule** `RegRex`

**default** `/https?:\/\/.+\.(jpg|gif|png|jpeg|webp|js|css)$/`

通过正则指定静态资源缓存 URL 的规则。

<br/>

**requestErr** `Function`

**default** `noop`

当请求报错的时候，会触发这个回调函数。

<br/>

**exceedQuotaErr** `Function`

**default** `noop`

当本地存储空间不够时，会触发这个回调函数。

<br/>


**patchjs.increment** `Boolean`

**default** `true`

是否开启字符级更新机制。

<br/>

**patchjs.urlRule** `RegRex`

**default** `/\d+\.\d+\.\d+\/.+\.(css|js)$/`

指定通过 Patchjs 缓存静态资源 URL 的规则。

<br/>
