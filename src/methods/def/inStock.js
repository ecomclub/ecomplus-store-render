'use strict'

const minQuantity = require('./minQuantity')

/**
 * Check if item has stock equal or greater than minimum quantity.
 * @memberOf Ecom.methods
 * @param {object} body - Object (product or variation) body
 * @returns {boolean}
 */

const inStock = body => {
  // check inventory
  if (body.hasOwnProperty('quantity')) {
    if (body.quantity >= minQuantity(body)) {
      // in stock
      return true
    }
  } else {
    // no stock control
    return true
  }
  // out of stock
  return false
}

module.exports = inStock
