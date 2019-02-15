'use strict'

// setup DOM object with document property
const DOM = (html, url, file, dom) => {
  if (dom) {
    // hard set
    DOM.document = dom
  } else if (typeof window === 'object' && window.document) {
    // browser
    DOM.document = window.document
  } else if (typeof require === 'function' && (html || url || file)) {
    // NodeJS environment
    // use JSDOM constructor
    // https://github.com/jsdom/jsdom
    const jsdom = require('jsdom')
    const { JSDOM } = jsdom

    let dom
    if (html) {
      dom = new JSDOM(html)
    } else {
      // get DOM from web link or local HTML file
      (url ? JSDOM.fromURL(url) : JSDOM.fromFile(file))
        .then(newDom => { dom = newDom })
    }
    DOM.document = dom.window.document
  }
}

module.exports = DOM
