'use strict'

/**
 * Filter categories list by parent category slug.
 * @memberOf Ecom.methods
 * @param {array} categories - List of category objects
 * @param {string} slug - Parent category slug value
 * @returns {array}
 */

const filterByParentSlug = (categories, slug) => {
  // for categories
  // filter by parent category slug
  let matchedCategories = []
  if (Array.isArray(categories)) {
    categories.forEach(category => {
      if (category.parent && category.parent.slug === slug) {
        matchedCategories.push(category)
      }
    })
  }
  // returns array of macthed category objects
  return matchedCategories
}

module.exports = filterByParentSlug
