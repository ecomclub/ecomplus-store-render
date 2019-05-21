/**
 * https://github.com/ecomclub/storefront-renderer
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

'use strict'

// Node.js environment
if (require.main !== module) {
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
