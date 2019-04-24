'use strict'

/**
 * Returns array of items (products) from Search API response.
 * @memberOf Ecom.methods
 * @param {object|array} body - Search response body or ELS hits array
 * @returns {array}
 */

const searchedItems = body => {
  let hits
  if (typeof body === 'object' && body !== null) {
    if (Array.isArray(body)) {
      hits = body
    } else if (body.hits) {
      // ELS response body
      hits = body.hits.hits || body.hits
    }
  }
  let items = []
  if (Array.isArray(hits)) {
    // map items array from ELS hits list
    hits.forEach(({ _id, _source }) => {
      items.push(Object.assign({}, _source, { _id }))
    })
  }
  return items
}

module.exports = searchedItems
