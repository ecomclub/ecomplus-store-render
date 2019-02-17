'use strict'

const specTextValue = require('./specTextValue')

/**
 * Parse variations specifications to one object only.
 * @memberOf Ecom.methods
 * @param {object} body - Product body object
 * @param {object} [filterGrids] - Filter object with grids and searched values
 * @param {string} [delimiter=', '] - Delimiter between each specification
 * @returns {object}
 */

const variationsGrids = (body, filterGrids, delimiter) => {
  let grids = {}
  if (body.hasOwnProperty('variations')) {
    body.variations.forEach(variation => {
      let specifications = variation.specifications
      // abstraction to get spec text value
      let specValue = grid => specTextValue(variation, grid, delimiter)

      if (specifications) {
        // check if current variation specs match with filters
        if (filterGrids) {
          for (let filter in filterGrids) {
            if (filterGrids.hasOwnProperty(filter)) {
              if (!specifications[filter] || specValue(filter) !== filterGrids[filter]) {
                // does not match filtered grid
                // skip current variation
                return
              }
            }
          }
        }

        // get values from each variation spec
        for (let grid in specifications) {
          if (specifications.hasOwnProperty(grid)) {
            let text = specValue(grid)
            if (!grids.hasOwnProperty(grid)) {
              grids[grid] = []
            } else if (grids[grid].indexOf(text) !== -1) {
              // current spec value has already been added
              continue
            }
            grids[grid].push(text)
          }
        }
      }
    })
  }
  // returns parsed grid object
  return grids
}

module.exports = variationsGrids
