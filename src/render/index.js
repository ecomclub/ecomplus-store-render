'use strict'

// VueJS 2
const Vue = require('vue')
// Ecom methods for Vue instance
const methods = require('./../methods/')

/**
 * Render specific DOM element.
 * @memberOf Ecom
 * @param {object} [store] - Store object with IDs
 * @param {object} el - DOM element object
 * @param {object} body - Body object to compose Vue instance data
 * @param {function} [load] - Load function to update body on instance data
 * @param {mixed} [args] - Compose data and work as filters to reload
 */

const render = (store, el, body, load, args) => {
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
  let data = { body, args }
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
      // setup reload method
      let reload = function () {
        if (typeof load === 'function') {
          let vm = this
          let callback = (err, body) => {
            if (err) {
              console.error(err)
            } else if (body) {
              // reactive update of instance data
              vm.body = body
            }
          }

          // run load function with args from instance data
          load(callback, vm.args)
        } else {
          console.log('WARN: no load function', this.$el)
        }
      }

      // create new Vue instance
      new Vue({
        mounted () {
          let el = this.$el
          if (el) {
            if (!el.dataset.vm) {
              // destroy Vue instace after element rendering
              this.$destroy()
              // mark element as rendered
              el.classList.add('rendered')
              return
            }
            // save Vue instance globally
            window[el.dataset.vm] = this
          }
          resolve()
        },

        data,
        template,
        methods: Object.assign({ reload }, methods),
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
