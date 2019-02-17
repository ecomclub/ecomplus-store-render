'use strict'

/*
 * Splits image size string and returns width or height.
 * @param {object} imgBody - Image object body
 * @param {integer} index - 0 for width, 1 for height
 * @returns {string|null}
 */

const splitImgSize = (imgBody, index) => {
  if (typeof imgBody === 'object' && imgBody !== null) {
    if (imgBody.hasOwnProperty('size')) {
      var sizes = imgBody.size.split('x')
      if (sizes.length === 2) {
        return sizes[index]
      }
    } else {
      // try with 'logo' body property by default
      return splitImgSize(imgBody.logo)
    }
  }
  return null
}

module.exports = splitImgSize
