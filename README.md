# ecomplus-store-render

[![CodeFactor](https://www.codefactor.io/repository/github/ecomclub/ecomplus-store-render/badge)](https://www.codefactor.io/repository/github/ecomclub/ecomplus-store-render)
[![npm version](https://img.shields.io/npm/v/ecomplus-render.svg)](https://www.npmjs.org/ecomplus-render)
[![license mit](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Vue.js app to render E-Com Plus store template.

It **requires** global `EcomIo` object from
[storefront JS SDK](https://github.com/ecomclub/ecomplus-sdk-js).

Include minified script via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/ecomplus-render@2/dist/render.min.js"></script>
```

Or install [npm package](https://www.npmjs.com/package/ecomplus-render):

`npm install --save ecomplus-render`

[Storefront theme documentation](https://developers.e-com.plus/docs/themes/).

## Compiling

You must have *gulp* installed globally:

```bash
npm install -g gulp
```

Setup dev dependencies:

```bash
cd ecomplus-store-render
npm install --only=dev
```

Run tasks:

```bash
gulp concat
gulp compress
```
