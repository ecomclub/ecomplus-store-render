'use strict'

/**
 * Returns the minimum quantity to add to cart.
 * @memberOf Ecom.methods
 * @param {object} body - Object (product or variation) body
 * @returns {number}
 */

const minQuantity = body => body.min_quantity || 1

module.exports = minQuantity
