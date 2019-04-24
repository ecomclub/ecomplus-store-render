# storefront-renderer

[![CodeFactor](https://www.codefactor.io/repository/github/ecomclub/storefront-renderer/badge)](https://www.codefactor.io/repository/github/ecomclub/storefront-renderer)
[![npm version](https://img.shields.io/npm/v/@ecomplus/storefront-renderer.svg)](https://www.npmjs.org/@ecomplus/storefront-renderer)
[![license mit](https://img.shields.io/badge/License-Apache-orange.svg)](https://opensource.org/licenses/Apache-2.0)

Render E-Com Plus store templates with Vue.js 2.

**[Storefront themes documentation](https://developers.e-com.plus/docs/themes/)**

[Renderer API reference](https://developers.e-com.plus/storefront-renderer/)

## Browser

### Recommended

Include minified bundle via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@ecomplus/storefront-renderer@1/dist/storefront.min.js"></script>
```

### Standalone

You can include the render standalone, it **requires** global `EcomIo` object from
[storefront JS SDK](https://github.com/ecomclub/ecomplus-sdk-js) and
[Vue](https://vuejs.org/v2/guide/#Getting-Started):

```html
<script src="https://cdn.jsdelivr.net/npm/@ecomplus/storefront-renderer@1/dist/render.min.js"></script>
```

### With bundlers

If using `webpack` or `browserify` (or relateds),
you can also include the
[npm package](https://www.npmjs.com/package/@ecomplus/storefront-renderer):

`npm install --save @ecomplus/storefront-renderer`

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
npm i -g @ecomplus/storefront-renderer
storefront-renderer https://mystore.com/product > product.html
```

### Node

```javascript
require('@ecomplus/storefront-renderer')(html).then(({ dom, Ecom }) => {
  Ecom.init().then(() => {
    // jsdom object
    console.log(dom.serialize())
  })
})
```

## Developing

Setup the package with GitHub and NPM:

```bash
git clone https://github.com/ecomclub/storefront-renderer
cd storefront-renderer
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
