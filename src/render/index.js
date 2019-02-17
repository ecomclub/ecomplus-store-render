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

  // create new Vue instance
  return new Promise(resolve => {
    let vm = new Vue({
      // set Vue mixin
      mixins: [ { methods } ],
      el,
      data,
      destroyed: () => {
        // mark element as rendered
        let el = this.$el
        if (typeof el === 'object' && el !== null && el.classList) {
          el.classList.add('rendered')
        }
        // element done
        resolve()
      }
    })

    // destroy Vue instace after element rendering
    vm.$destroy()
  })
}
