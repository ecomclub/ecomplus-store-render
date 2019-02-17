'use strict'

const findByProperty = require('./findByProperty')

/**
 * Find object from list by slug value.
 * @memberOf Ecom.methods
 * @param {array} list - List of nested objects
 * @param {string} slug - Object (category, brand...) slug value
 * @returns {object|undefined}
 */

const findBySlug = (list, slug) => {
  // must be an array
  if (Array.isArray(list)) {
    return findByProperty(list, 'slug', slug)
  }
  return undefined
}

module.exports = findBySlug
