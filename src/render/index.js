'use strict'

/**
 * Stores list.
 * @memberOf Ecom
 * @type {array}
 */

const stores = []

/**
 * Render entire document.
 * @memberOf Ecom
 * @param {function} [callback] - Render callback function
 * @param {integer} [storeId] - Store ID
 * @param {string} [storeObjectId] - 24 bytes hexadecimal Store Object ID
 * @param {string} [lang] - Force language by code such as 'en_us'
 */

const init = (callback, storeId, storeObjectId, lang) => {
  if (typeof window === 'object') {
    // debug on browser
    console.log('Init E-Com Plus store rendering')
  }

  // get document object
  const { document } = require('./../lib/dom')
  if (!document) {
    throw new Error('Root `document` (DOM) object is undefined or invalid')
  }

  if (storeId && storeObjectId) {
    // set store from function arguments
    store = {
      'store_id': parseInt(storeId, 10),
      'store_object_id': storeObjectId
    }
    if (lang) {
      store.lang = lang
    }
    stores.push(store)
  } else {
    // try to set store from HTML DOM
    var domStores = root['document'].getElementsByClassName('_ecom-store')
    if (typeof domStores === 'object' && domStores !== null) {
      for (i = 0; i < domStores.length; i++) {
        var el = domStores[i]
        store = {
          'el': el
        }
        // check data properties
        if (el.dataset.store && el.dataset.id) {
          store.store_id = parseInt(el.dataset.store, 10)
          store.store_object_id = el.dataset.id
        }
        if (el.dataset.lang) {
          store.lang = el.dataset.lang
        }
        stores.push(store)
      }
    }
  }

  // start rendering
  if (stores.length) {
    i = 0
    // set renderization callback
    cb = function () {
      i++
      if (i < stores.length) {
        render(stores[i])
      } else if (typeof callback === 'function') {
        // all done
        // handle renderization callback param
        callback()
      }
    }
    // first store
    render(stores[i])
  }
}

module.exports = {
  init,
  stores
}
