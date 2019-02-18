'use strict'

// VueJS 2
const Vue = require('vue')
// Ecom methods for Vue instance
const methods = require('./../methods/')

module.exports = (store, el, body) => {
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

  // save the original template on new script tag
  let tmp = document.createElement('script')
  tmp.setAttribute('type', 'text/x-template')
  tmp.innerHTML = el.innerHTML
  // insert after the ._ecom-el element
  el.parentNode.insertBefore(tmp, el.nextSibling)

  return new Promise(resolve => {
    // create new Vue instance
    new Vue({
      mixins: [ { methods } ],
      data,
      mounted () {
        // destroy Vue instace after element rendering
        this.$destroy()
      },
      destroyed () {
        // mark element as rendered
        if (this.$el) {
          this.$el.classList.add('rendered')
        }
        // element done
        resolve()
      }
    }).$mount(el)
  })
}
