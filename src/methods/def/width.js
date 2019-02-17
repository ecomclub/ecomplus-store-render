'use strict'

const splitImgSize = require('./../aux/splitImgSize')

/**
 * Returns width (px) of image object.
 * @memberOf Ecom.methods
 * @param {object} imgBody - Image object body
 * @returns {string}
 */

const width = imgBody => splitImgSize(imgBody, 0) || ''

module.exports = width
