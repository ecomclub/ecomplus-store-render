'use strict'

// VueJS 2
const Vue = require('vue')
// Vue SSR
const renderer = require('vue-server-renderer').createRenderer()
// Ecom methods for Vue instance
const methods = require('./../methods/')

module.exports = (el, data) => {
  if (el && typeof require === 'function') {
    // Node.js environment
    // check SSR option on element data first
    let hydration = true
    switch (el.dataset.ssr) {
      case undefined:
        break
      case 'no-hydration':
        hydration = false
        break
      case 'disabled':
        return Promise.resolve()
      default:
        break
    }

    // mark element as pre rendered
    el.setAttribute('v-bind:class', '\'pre-rendered\'')
    if (hydration) {
      // SSR with runtime hydration
      // save the original template on new script tag
      let script = require('./../lib/dom').document.createElement('script')
      script.setAttribute('type', 'text/x-template')
      script.innerHTML = el.outerHTML
      // insert after the ._ecom-el element
      el.parentNode.insertBefore(script, el.nextSibling)
    } else {
      // no hydration
      // disable runtime rendering when already prerendered
      el.classList.remove('_ecom-el')
    }
    // intance template string
    let template = el.outerHTML

    // new Vue instance
    // assing additional methods (browser only) to prevent Vue error
    let reload, run, set
    reload = run = set = () => {
      // do nothing
      return null
    }
    // manually set template and keep Vue instance unmounted
    const vm = new Vue({
      data,
      template,
      methods: Object.assign({ run, reload, set }, methods)
    })

    // do the renderization
    return renderer.renderToString(vm).then(html => {
      // save HTML on DOM
      el.outerHTML = html
    }).catch(err => {
      console.error(err)
    })
  }
}
