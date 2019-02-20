'use strict'

/**
 * Check if is array and includes a specified string element.
 * @memberOf Ecom.methods
 * @param {mixed} list - Expected array of strings
 * @param {string} str - String to search on list
 * @returns {array}
 */

const includes = (list, str) => Array.isArray(list) && list.indexOf(str) > -1

module.exports = includes
