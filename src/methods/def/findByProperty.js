'use strict'

/**
 * Find object from list by some property value.
 * @memberOf Ecom.methods
 * @param {array} list - List of nested objects
 * @param {string} prop - Property name
 * @param {mixed} value - Property value to be matched
 * @returns {object|undefined}
 */

const findByProperty = (list, prop, value) => {
  // must be an array
  if (Array.isArray(list)) {
    for (let i = 0; i < list.length; i++) {
      let obj = list[i]
      if (obj && obj[prop] === value) {
        // object found
        return obj
      }
    }
  }
  return undefined
}

module.exports = findByProperty
