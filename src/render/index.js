'use strict'

// Vue.js 2
const Vue = require('vue')
// Ecom methods for Vue instance
const methods = require('./../methods/')
// preload grids list
const grids = require('./../data/grids')
// get document and location objects
const { document, location } = require('./../lib/dom')

/**
 * Render specific DOM element.
 * @memberOf Ecom
 * @param {object} [store] - Store object with IDs
 * @param {object} el - DOM element object
 * @param {object} body - Body object to compose Vue instance data
 * @param {function} [load] - Load function to update body on instance data
 * @param {object} [args] - Compose data and work as filters to reload
 * @param {object} [payload] - Additional payload to instance data
 */

const render = (store, el, body, load, args, payload) => {
  // check if element is marked as current
  let isCurrent = el.dataset.current === 'true' || el.dataset.current === true
  if (typeof Ecom === 'object') {
    // on browser
    /* global Ecom */
    if (!store && Ecom.stores.length) {
      // use first recognized store
      store = Ecom.stores[0]
    }
    if (!Ecom.hasOwnProperty('currentObject') && isCurrent) {
      // force as current object
      Ecom.currentObject = body
    }
  }

  if (!store) {
    // empty store object ?
    store = {}
  }
  // setup instance data
  // also pass store properties to instance data
  let data = {
    body,
    args,
    payload,
    store,
    // widgets configurations
    // declare empty object first
    config: {}
  }

  // custom variables from data-payload and widget configuration from data-config
  ;[ 'payload', 'config' ].forEach(label => {
    if (el.dataset.hasOwnProperty(label)) {
      try {
        let obj = JSON.parse(el.dataset[label])
        // ensure it is an object
        if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
          // override on instance data
          data[label] = obj
          return
        }
      } catch (e) {
        // continue
      }
      console.log('Ignoring invalid element ' + label + ':')
      console.log(el)
    }
  })

  // handle prerendered (SSR) content
  let template, preRendered
  if (el.dataset.serverRendered) {
    // element already rendered server side
    // setup client side hydration
    let script = el.nextSibling
    if (script && script.tagName === 'SCRIPT') {
      template = script.innerHTML
      // unset to prevent Vue warn
      delete el.dataset.serverRendered
      // save pre rendered HTML to further check modifications
      preRendered = el.outerHTML
    }
  }

  return new Promise(resolve => {
    // preload grids data per store before creating Vue instance
    grids(store.store_id).then(() => {
      if (typeof window === 'object' && window.document) {
        // on browser
        // setup reload method
        let reload = function () {
          if (typeof load === 'function') {
            let vm = this

            // callback for SDK method
            let callback = (err, body) => {
              if (err) {
                console.error(err)
                // trigger custom event with error object as payload
                vm.$emit('reloadError', err)
              } else if (body) {
                // reactive update of instance data
                vm.body = body
                // emit custom event
                vm.$emit('reloadSuccess')
              }
            }

            // run load function with args from instance data
            load(callback, vm.args, vm.payload)
          } else {
            console.log('WARN: no load function', this.$el)
          }
        }

        // setup Vue options
        let vmOptions = {
          data,
          template,
          methods: Object.assign({ reload }, methods)
        }
        // in some cases we should mount the instance on new element first
        let elNew

        let instanceName = el.dataset.vm
        if (instanceName) {
          // keep instance alive
          if (args) {
            // observe args to reload body
            args.updated = Date.now()
            vmOptions.watch = {
              args: {
                handler () {
                  this.reload()
                },
                deep: true
              }
            }
          }

          // resolve promise on instance mounted
          vmOptions.mounted = function () {
            // save Vue instance globally
            window[instanceName] = this
            resolve()
          }
        } else {
          if (preRendered) {
            // mount the instance on new DOM element
            // keeps original element intact with pre rendered content
            elNew = document.createElement('div')
          }

          vmOptions.mounted = function () {
            // destroy Vue instace after element rendering
            this.$destroy()

            if (elNew && this.$el.outerHTML !== preRendered) {
              // update original element content
              // force element height to prevent resize effect
              el.style.minHeight = el.offsetHeight + 'px'
              setTimeout(() => {
                el.style.minHeight = ''
              }, 1500)
              // content was modified
              el.innerHTML = this.$el.innerHTML
              // add rendered class to trigger animation
              el.classList.add('rendered')
            }
          }

          // resolve promise on instance destroyed
          vmOptions.destroyed = resolve
        }

        if (!template) {
          // mark element as rendered with Vue
          el.setAttribute('v-bind:class', '\'rendered\'')
        }
        // create new Vue instance
        new Vue(vmOptions).$mount(elNew || el)
      } else {
        // NodeJS ?
        // handle server side rendering
        require('./ssr')(el, data).finally(resolve)
      }
    })

    if (location && isCurrent && location.pathname === '/' + body.slug) {
      // set page metadata using current object body
      if (body.meta_title) {
        // title tag
        document.title = body.meta_title
      }
      if (body.meta_description) {
        // meta description tag
        var elMeta = document.querySelector('meta[name="description"]')
        if (elMeta) {
          elMeta.setAttribute('content', body.meta_description)
        }
      }
    }
  })
}

module.exports = render
