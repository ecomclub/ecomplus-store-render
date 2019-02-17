'use strict'

const onPromotion = require('./onPromotion')

/**
 * Returns object current price.
 * @memberOf Ecom.methods
 * @param {object} body - Object (product or variation) body
 * @returns {number}
 */

const price = body => {
  // prefer promotional price
  if (!body.hasOwnProperty('base_price') || onPromotion(body)) {
    // sale price
    return body.price || 0
  } else {
    return body.base_price || 0
  }
}

module.exports = price
