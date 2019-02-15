/**
 * https://github.com/ecomclub/ecomplus-store-render
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

'use strict'

// create Ecom object with library methods
// render entire document
const init = require('./lib/init')
// render specific elements manually
const render = require('./lib/render')
// render main object
const Ecom = {
  init,
  render
}

// exports function to handle DOM before returning Ecom object
module.exports = function () {
  // setup DOM
  // bypass all arguments
  require('./lib/dom')(this, arguments)
  return Ecom
}

if (typeof window === 'object' && window.document) {
  // on browser
  // setup dependencies
  // save libraries globally
  let Vue
  if (!window.Vue) {
    Vue = require('vue')
    window.Vue = Vue
  } else {
    Vue = window.Vue
  }
  if (!window.EcomIo) {
    window.EcomIo = require('ecomplus-sdk')
  }
  window.Ecom = Ecom

  // config global Vue constructor
  Vue.default.config.errorHandler = (err, vm, info) => {
    console.error(err)
    // identify the instance
    console.log('Vue instance with error, $el and $data:')
    console.log(vm.$el)
    console.log(vm.$data)
    console.log(info)
    console.log('-----//-----')
  }
}

// handle command line task
require('./cli')
