'use strict'

/**
 * Returns array of spec objects for specified grid.
 * @memberOf Ecom.methods
 * @param {object|array} body - Product body or array of variation objects
 * @param {string} grid - Grid ID string such as 'color'
 * @returns {array}
 */

const specValues = (body, grid) => {
  var specValues = []
  if (Array.isArray(body)) {
    if (body.length) {
      if (body[0].specifications) {
        // variations array sent as body param
        for (var i = 0; i < body.length; i++) {
          specValues = specValues.concat(specValues(body[i], grid))
        }
      } else if (body[0].text) {
        // spec values list sent as body param
        specValues = body
      }
    }
  } else {
    var specifications = body.specifications
    if (specifications) {
      for (var Grid in specifications) {
        if (specifications.hasOwnProperty(Grid) && Grid === grid) {
          // specification found
          specValues = specifications[grid]
        }
      }
    }
  }
  return specValues
}

module.exports = specValues
