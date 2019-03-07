'use strict'

// try to get grids list from reusable data
const gridsByStore = require('./../../data/grids')

/**
 * Returns array of spec objects for specified grid.
 * @memberOf Ecom.methods
 * @param {object|array} body - Product body or array of variation objects
 * @param {string} gridId - Grid ID string such as 'color'
 * @returns {array}
 */

const specValues = function (body, gridId) {
  if (typeof body !== 'object' || body === null) {
    // nothing to do
    // returns empty array by default
    return []
  }

  let values = []
  if (Array.isArray(body)) {
    if (body.length) {
      if (body[0].specifications) {
        // variations array sent as body param
        for (var i = 0; i < body.length; i++) {
          values = values.concat(specValues(body[i], gridId))
        }
      } else if (body[0].text) {
        // spec values list sent as body param
        values = body
      }
    }
  } else {
    // probably the body object from instance data
    // work for product or specific variation body
    let specifications = body.specifications
    if (specifications) {
      for (let id in specifications) {
        if (specifications.hasOwnProperty(id) && id === gridId) {
          // specification found
          values = specifications[gridId]
        }
      }
    }

    if (!values.length && this && this.store) {
      // try with grids list from preloaded data
      const grids = gridsByStore(this.store.store_id, true)
      let specs, grid
      // match the grid by ID
      if (grids && (grid = grids.find(grid => grid.grid_id === gridId)) && grid.options) {
        // mounts specs array from grid options list
        specs = grid.options.map(option => {
          // try color RGB value or use default option ID
          let value
          if (option.colors && option.colors.length) {
            value = option.colors[0]
          } else {
            value = option.option_id
          }

          // spec options with text and value
          return {
            text: option.text,
            value
          }
        })
      }
      return specValues(specs, gridId)
    }
  }
  return values
}

module.exports = specValues
