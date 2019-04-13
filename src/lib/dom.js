'use strict'

/**
 * Setup DOM object with document property.
 * Should at least only one of possible params.
 * @namespace
 * @type {function}
 * @param {string} [html] - HTML string to render
 * @param {string} [url] - Page link
 * @param {string} [file] - Path of HTML file
 * @param {object} [dom] - Parsed DOM object
 */

const DOM = (html, url, file, dom) => {
  return new Promise((resolve, reject) => {
    if (dom) {
      // hard set
      resolve(dom)
    } else if (typeof require === 'function' && (html || url || file)) {
      // NodeJS environment
      // use JSDOM constructor
      // https://github.com/jsdom/jsdom
      const jsdom = require('jsdom')
      const { JSDOM } = jsdom

      if (html) {
        let options
        if (url) {
          // url sets the value returned by window.location
          options = { url }
        }
        resolve(new JSDOM(html, options))
      } else {
        // get DOM from web link or local HTML file
        (url ? JSDOM.fromURL(url) : JSDOM.fromFile(file)).then(resolve)
      }
    } else {
      reject(new Error('Cannot setup DOM'))
    }
  })

    .then(dom => {
      /**
       * Document object.
       * @type {object}
       * @memberOf DOM
       */

      DOM.document = dom.window.document

      /**
       * Location object.
       * @type {object}
       * @memberOf DOM
       */

      DOM.location = dom.window.location

      // pass dom to next function
      return dom
    })
}

if (typeof window === 'object' && window.document) {
  // browser
  DOM.document = window.document
  DOM.location = window.location
}

module.exports = DOM
