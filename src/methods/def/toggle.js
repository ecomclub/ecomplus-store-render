'use strict'

/**
 * Add or remove an element from array of strings.
 * @memberOf Ecom.methods
 * @param {array} list - Array of strings
 * @param {string} str - String to toggle on list
 * @returns {array}
 */

const toggle = (list, str) => {
  if (Array.isArray(list)) {
    let index = list.indexOf(str)
    if (index > -1) {
      // string found
      // remove element from list
      list.splice(index, 1)
    } else {
      // not found
      // add element
      list.push(str)
    }
  }
  return list
}

module.exports = toggle
