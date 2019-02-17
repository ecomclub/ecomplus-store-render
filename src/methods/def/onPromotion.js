'use strict'

/**
 * Check if item has promotional price.
 * @memberOf Ecom.methods
 * @param {object} body - Object (product or variation) body
 * @returns {boolean}
 */

const onPromotion = body => {
  if (body.hasOwnProperty('price_effective_date')) {
    var now = new Date()
    if (body.price_effective_date.hasOwnProperty('start')) {
      // start date and time in ISO 8601
      if (new Date(body.price_effective_date.start) < now) {
        return false
      }
    }
    if (body.price_effective_date.hasOwnProperty('end')) {
      // promotion end date and time in ISO 8601
      if (new Date(body.price_effective_date.end) > now) {
        return false
      }
    }
  }
  // default to no promotion
  return !!(body.hasOwnProperty('price') && body.hasOwnProperty('base_price'))
}

module.exports = onPromotion
