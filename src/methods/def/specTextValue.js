'use strict'

const specValues = require('./specValues')

/**
 * Parse specifications array of nested objects to string.
 * @memberOf Ecom.methods
 * @param {object|array} body - Product body or array of variation objects
 * @param {string} grid - Grid ID string such as 'color'
 * @param {string} [delimiter=', '] - Delimiter between each specification
 * @returns {string|null}
 */

const specTextValue = (body, grid, delimiter = ', ') => {
  // using text property of each spec object
  let values = specValues(body, grid)
  if (values.length) {
    let valuesString = values[0].text
    for (let i = 1; i < values.length; i++) {
      valuesString += delimiter + values[i].text
    }
    return valuesString
  }
  // specification not found
  return null
}

module.exports = specTextValue
