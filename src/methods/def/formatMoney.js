'use strict'

const price = require('./price')

/**
 * Parse price number to formatted string with currency symbol.
 * @memberOf Ecom.methods
 * @param {number|object} value - Price number or object (product or variation) body
 * @param {string} [decimal=','] - Decimal delimiter
 * @param {string} [thousands='.'] - Thousands delimiter
 * @param {number} [numFixed=2] - Number of decimal precision
 * @returns {string}
 */

const formatMoney = (value, decimal = ',', thousands = '.', numFixed = 2) => {
  // price to number
  if (typeof value === 'object') {
    if (value !== null) {
      // suppose to be product object
      value = price(value)
    }
  } else if (typeof value === 'string') {
    value = parseFloat(value)
  }
  // format price string
  if (typeof value === 'number' && !isNaN(value)) {
    return value.toFixed(numFixed).replace(thousands, decimal).replace(/(\d)(?=(\d{3})+,)/g, '$1.')
  } else {
    // eg.: 0,00
    var zero = '0' + decimal
    for (var i = 0; i < numFixed; i++) {
      zero += '0'
    }
    return zero
  }
}

module.exports = formatMoney
