/**
 * https://github.com/ecomclub/storefront-renderer
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

'use strict'

if (typeof window === 'object' && window.document) {
  // on browser
  // setup dependencies globally
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
  let dataset = document.body.dataset
  let initPromise
  if (!dataset.ecomWait) {
    // start renderization automatically
    window.EcomInit = initPromise = Ecom.init()
  }

  if (typeof $ === 'function' && !dataset.ecomSkipJquery) {
    // delay jQuery ready event to improve compatibility
    /* global $ */
    $.holdReady(true)
    initPromise.then(() => $.holdReady(false))
  }
} else if (require.main !== module) {
  // NodeJS ?

  /**
   * Exports function to call {@link DOM} setup and return {@link Ecom} object.
   * @module ecomplus-render
   * @see DOM
   * @returns {Promise} {@link Ecom}
   * @example require('ecomplus-render')(html).then(({ dom, Ecom }) => Ecom.init())
   */

  module.exports = function () {
    // setup DOM
    // bypass all arguments
    return require('./lib/dom').apply(this, arguments).then(dom => {
      // pass dom (jsdom) and Ecom objects to next function
      return {
        dom,
        Ecom: require('./ecom')
      }
    })
  }
} else {
  // called directly
  // handle command line task
  require('./cli')
}
