/**
 * https://github.com/ecomclub/ecomplus-store-render
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

'use strict'

/**
 * Ecom object with renderer methods.
 * @namespace
 */

const Ecom = require('./ecom')

/**
 * Exports function to call {@link DOM} and return {@link Ecom} object.
 * @module ecomplus-render
 * @see DOM
 * @returns {Promise} {@link Ecom}
 * @example require('ecomplus-render')(html).then(Ecom => Ecom.init())
 */

module.exports = function () {
  // setup DOM
  // bypass all arguments
  return require('./lib/dom')(this, arguments)
    .then(() => Promise.resolve(Ecom))
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

  // polyfill Promises
  require('es6-promise').polyfill()
} else {
  // NodeJS ?
  // handle command line task
  require('./cli')
}
