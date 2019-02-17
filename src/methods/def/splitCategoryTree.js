'use strict'

/**
 * Parse category tree string to array.
 * @memberOf Ecom.methods
 * @param {object|string} body - Product object body or category tree string
 * @returns {array}
 */

const splitCategoryTree = body => {
  let categories = []
  let categoryTree
  if (typeof body === 'string') {
    // category tree string already sent as body param
    categoryTree = body
  } else {
    categoryTree = body.category_tree
  }
  if (categoryTree) {
    categories = categoryTree.split('>')
    for (let i = 0; i < categories.length; i++) {
      // remove white spaces from names
      categories[i] = categories[i].trim()
    }
  }
  // return array of categories
  return categories
}

module.exports = splitCategoryTree
