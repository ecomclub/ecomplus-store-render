'use strict'

const specValues = require('./specValues')

/**
 * Get value property of spec object based on respective text.
 * @memberOf Ecom.methods
 * @param {object|array} body - Product body or array of variation objects
 * @param {string} gridId - Grid ID string such as 'color'
 * @param {string} specText - Spec object text property such as 'Blue'
 * @returns {string|undefined}
 */

const specValueByText = function (body, gridId, specText) {
  let values = specValues.call(this, body, gridId)
  for (let i = 0; i < values.length; i++) {
    if (values[i].text === specText) {
      return values[i].value
    }
  }
  // any spec found for received grid and option text
  return undefined
}

module.exports = specValueByText
