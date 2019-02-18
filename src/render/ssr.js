'use strict'

// VueJS 2
const Vue = require('vue')
// Vue SSR
const renderer = require('vue-server-renderer').createRenderer()
// Ecom methods for Vue instance
const methods = require('./../methods/')
// get document object
const { document } = require('./../lib/dom')

module.exports = (el, data) => {
  if (el && typeof require === 'function') {
    // NodeJS environment
    // save the original template on new script tag
    let template = el.outerHTML
    let script = document.createElement('script')
    script.setAttribute('type', 'text/x-template')
    script.innerHTML = template
    // insert after the ._ecom-el element
    el.parentNode.insertBefore(script, el.nextSibling)

    // new Vue instance
    // manually set template and keep Vue instance unmounted
    const vm = new Vue({
      data,
      template,
      methods
    })

    // do the renderization
    return renderer.renderToString(vm).then(html => {
      // save HTML on DOM
      el.outerHTML = html
      // mark element as rendered
      el.classList.add('rendered')
    }).catch(err => {
      console.error(err)
    })
  }
}
