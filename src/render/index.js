'use strict'

// VueJS 2
const Vue = require('vue')
// Ecom methods for Vue instance
const methods = require('./../methods/')

// setup Vue mixin for all instances
// used on browser only
const vueMixin = {
  methods,
  mounted () {
    let el = this.$el
    if (el) {
      if (!el.dataset.vm) {
        // destroy Vue instace after element rendering
        this.$destroy()
        // mark element as rendered
        el.classList.add('rendered')
      } else {
        // save Vue instance globally
        window[el.dataset.vm] = this
      }
    }
  }
}

/**
 * Render specific DOM element.
 * @memberOf Ecom
 * @param {object} [store] - Store object with IDs
 * @param {object} el - DOM element object
 * @param {object} body - Body object to compose Vue instance data
 */

const render = (store, el, body) => {
  // pass store properties to instance data
  if (store) {
    body.Store = store
  }

  if (typeof Ecom === 'object') {
    // on browser
    /* global Ecom */
    if (!store && Ecom.stores.length) {
      // use first recognized store
      body.Store = Ecom.stores[0]
    }
    if (!Ecom.hasOwnProperty('currentObject') && el.dataset.current === 'true') {
      // force as current object
      Ecom.currentObject = body
    }
  }

  // handle element data
  let data = { body }
  // get custom variables from data-payload
  if (el.dataset.hasOwnProperty('payload')) {
    try {
      data.payload = JSON.parse(el.dataset.payload)
    } catch (e) {
      console.log('Ignoring invalid element payload:')
      console.log(el)
    }
  }

  let template
  if (el.dataset.serverRendered) {
    // element already rendered server side
    // setup client side hydration
    let script = el.nextSibling
    if (script && script.tagName === 'SCRIPT') {
      template = el.nextSibling.innerHTML
      // unset to prevent Vue warn
      delete el.dataset.serverRendered
    }
  }

  return new Promise(resolve => {
    if (typeof window === 'object' && window.document) {
      // on browser
      // create new Vue instance
      new Vue({
        mixins: [ vueMixin ],
        data,
        template,
        destroyed: resolve
      }).$mount(el)
    } else {
      // NodeJS ?
      // handle server side rendering
      require('./ssr')(el, data).finally(resolve)
    }
  })
}

module.exports = render
