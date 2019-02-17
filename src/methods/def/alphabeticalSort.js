'use strict'

/**
 * Sort list of objects alphabetically by name property.
 * @memberOf Ecom.methods
 * @param {array|object} list - List of nested objects or object with results
 * @returns {array}
 */

const alphabeticalSort = list => {
  if (Array.isArray(list)) {
    // try to sort by name
    list.sort((a, b) => {
      if (a.name < b.name) return -1
      return 1
    })
  } else if (typeof list === 'object' && list !== null) {
    // suppose to be a 'list all' request body
    return alphabeticalSort(list.results)
  } else {
    // must be an array
    list = []
  }
  return list
}

module.exports = alphabeticalSort
