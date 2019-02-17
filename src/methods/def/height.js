'use strict'

const splitImgSize = require('./../aux/splitImgSize')

/**
 * Returns height (px) of image object.
 * @memberOf Ecom.methods
 * @param {object} imgBody - Image object body
 * @returns {string}
 */

const width = imgBody => splitImgSize(imgBody, 1) || ''

module.exports = width
