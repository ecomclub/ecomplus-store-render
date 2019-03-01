# ecomplus-store-render

[![CodeFactor](https://www.codefactor.io/repository/github/ecomclub/ecomplus-store-render/badge)](https://www.codefactor.io/repository/github/ecomclub/ecomplus-store-render)
[![npm version](https://img.shields.io/npm/v/ecomplus-render.svg)](https://www.npmjs.org/ecomplus-render)
[![license mit](https://img.shields.io/badge/License-Apache-orange.svg)](https://opensource.org/licenses/Apache-2.0)

Render E-Com Plus store templates with Vue.js 2.

**[Storefront themes documentation](https://developers.e-com.plus/docs/themes/)**

[Renderer API reference](https://developers.e-com.plus/ecomplus-store-render/)

## Browser

### Recommended

Include minified bundle via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/ecomplus-render@3/dist/storefront.min.js"></script>
```

### Standalone

You can include the render standalone, it **requires** global `EcomIo` object from
[storefront JS SDK](https://github.com/ecomclub/ecomplus-sdk-js) and
[Vue](https://vuejs.org/v2/guide/#Getting-Started):

```html
<script src="https://cdn.jsdelivr.net/npm/ecomplus-render@3/dist/render.min.js"></script>
```

### With bundlers

If using `webpack` or `browserify` (or relateds),
you can also include the
[npm package](https://www.npmjs.com/package/ecomplus-render):

`npm install --save ecomplus-render`

## Server side rendering

The package is also compatible with NodeJS backend,
handling SSR with
[jsdom](https://github.com/jsdom/jsdom) and
[Vue SSR](https://ssr.vuejs.org/).

Even rendered pages must include the render to run on browser,
HTML will be updated (hydrate) client-side
to keep critical data always up to date.

### Command line

```bash
cd ecomplus-store-render
node src/index.js https://mystore.com/product > product.html
```

### Node

```javascript
require('ecomplus-render')(html).then(({ dom, Ecom }) => {
  Ecom.init().then(dom => {
    // jsdom object
    console.log(dom.serialize())
  })
})
```

## Developing

Setup the package with NPM:

```bash
cd ecomplus-store-render
npm i
```

Watch tests server:

```bash
npm run serve
```

Update JSDoc files on `docs` folder:

```bash
npm run doc
```

Compile to production:

```bash
npm run build
```
