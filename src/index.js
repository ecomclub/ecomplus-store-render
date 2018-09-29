/**
 * https://github.com/ecomclub/ecomplus-store-render
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

// set auxiliar global object
var __ecom = {};

(function () {
  'use strict'

  /*
    Handle compatibility with Node.js, RequireJS as well as without them
    No bundlers or transpilers
    Based on UnderscoreJS implementation:
    https://github.com/jashkenas/underscore/blob/master/underscore.js
  */

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  /* global self */
  var root = (typeof self === 'object' && self.self === self && self) ||
             (typeof global === 'object' && global.global === global && global) ||
             this ||
             {}

  // main object
  var Ecom = {}
  __ecom = {
    Ecom: Ecom,
    root: root
  }

  // load dependencies
  var libs = {
    Vue: 'vue',
    EcomIo: 'ecomplus-sdk'
  }
  for (var lib in libs) {
    if (libs.hasOwnProperty(lib)) {
      var pack = libs[lib]

      // handle require function with compatibility
      if (typeof require === 'function') {
        // require module
        __ecom[lib] = require(pack)
      } else if (root.hasOwnProperty(pack)) {
        // get from global
        __ecom[lib] = root[pack]
      } else {
        console.error(lib + ' (`' + pack + '`) is required and undefined')
        return
      }
    }
  }

  // Export the Ecom object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `Ecom` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports !== 'undefined' && !exports.nodeType) {
    // handle exports
    if (typeof module !== 'undefined' && module.exports && !module.nodeType) {
      exports = module.exports = Ecom
    }
    exports.Ecom = Ecom
  } else {
    // set object on root
    root.Ecom = Ecom
  }
}())

// concatenate scripts
// require('partials/**')
