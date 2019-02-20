'use strict'

/**
 * Handle custom functions inside Vue instance from window object.
 * @memberOf Ecom.methods
 * @param {string} func - Name of the global function
 * @param {mixed} [payload] - Payload passed to window[func]
 */

const run = function (func, payload) {
  // try to call global function
  let fn = window[func]
  if (typeof fn === 'function') {
    return fn({
      // pass body object from instance data
      body: this.body || {},
      // bypass received payload
      payload
    })
  } else {
    // debug
    console.log('WARN: window.' + func + ' isn\'t a function', this.$el)
  }
}

module.exports = run
