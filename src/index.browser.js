/**
 * https://github.com/ecomclub/storefront-renderer
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

'use strict'

// on browser
// setup dependencies globally
let Vue, EcomIo
if (!window.Vue) {
  Vue = require('vue')
  window.Vue = Vue
} else {
  Vue = window.Vue
}
if (!window.EcomIo) {
  EcomIo = require('ecomplus-sdk')
  window.EcomIo = EcomIo
} else {
  EcomIo = window.EcomIo
}

// config global Vue constructor
if (Vue.config) {
  Vue.config.errorHandler = (err, vm, info) => {
    console.error(err)
    // identify the instance
    console.log('Vue instance with error, $el and $data:')
    console.log(vm.$el)
    console.log(vm.$data)
    console.log(info)
    console.log('-----//-----')
  }
}

/**
 * Ecom object with renderer methods.
 * @namespace
 */

const Ecom = require('./ecom')
window.Ecom = Ecom

// automatic handlers for browser
// check <body> data
let bodyConfig = document.body.dataset
let EcomInit
if (!bodyConfig.ecomWait) {
  // start renderization automatically
  window.EcomInit = EcomInit = Ecom.init()
}
if (typeof module !== 'undefined' && module.exports) {
  // handle exports for Webpack and Browserify
  module.exports = { Vue, Ecom, EcomIo, EcomInit }
}

if (typeof $ === 'function' && !bodyConfig.ecomSkipJquery) {
  // delay jQuery ready event to improve compatibility
  /* global $ */
  $.holdReady(true)
  EcomInit.then(() => $.holdReady(false))
}
