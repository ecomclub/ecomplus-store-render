'use strict'

const specValues = require('./specValues')

/**
 * Get value property of spec object based on respective text.
 * @memberOf Ecom.methods
 * @param {object|array} body - Product body or array of variation objects
 * @param {string} grid - Grid ID string such as 'color'
 * @param {string} text - Spec object text property such as 'Blue'
 * @returns {string|undefined}
 */

const specValueByText = (body, grid, text) => {
  let values = specValues(body, grid)
  for (var i = 0; i < values.length; i++) {
    if (values[i].text === text) {
      return values[i].value
    }
  }
  // any spec found for received grid and option text
  return undefined
}

module.exports = specValueByText
