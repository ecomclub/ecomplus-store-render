'use strict'

const name = require('./name')
// try to get grids list from reusable data
const gridsByStore = require('./../../data/grids')

/**
 * Returns grid title by grid ID and lang.
 * @memberOf Ecom.methods
 * @param {string} gridId - The unique ID of the grid ('colors', 'size'...)
 * @param {string} [lang] - Language by code such as 'pt_br'
 * @returns {string}
 */

const gridTitle = function (gridId, lang) {
  let grid
  if (typeof this === 'object' && this !== null && this.store) {
    // this is the Vue instance
    // get grids list of current store
    const grids = gridsByStore(this.store.store_id, true)
    if (grids) {
      // match the grid by ID
      grid = grids.find(grid => grid.grid_id === gridId)
    }
  }

  if (grid) {
    if (!lang) {
      // default store lang
      lang = this.store.lang
    }
    return name(grid, lang)
  }
  // returns the received grid ID by default
  return gridId
}

module.exports = gridTitle
