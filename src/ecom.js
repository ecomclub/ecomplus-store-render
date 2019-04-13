'use strict'

// render specific element
const render = require('./render/')
// render all nested elements by store
const renderStore = require('./render/store')
// auxiliary methods for Vue instances
const methods = require('./methods/')

/**
 * Stores list.
 * @memberOf Ecom
 * @type {array}
 */

let stores = []

/**
 * Render entire document.
 * @memberOf Ecom
 * @param {integer} [storeId] - Store ID
 * @param {string} [storeObjectId] - 24 bytes hexadecimal Store Object ID
 * @param {string} [lang] - Force language by code such as 'en_us'
 */

const init = (storeId, storeObjectId, lang) => {
  if (typeof window === 'object') {
    // debug on browser
    console.log('Init E-Com Plus store rendering')
  }
  // reset stores array
  stores = []

  // get document object
  const { document } = require('./lib/dom')
  if (!document) {
    throw new Error('Root `document` (DOM) object is undefined or invalid')
  }

  if (storeId && storeObjectId) {
    // set store from function params
    let store = {
      store_id: parseInt(storeId, 10),
      store_object_id: storeObjectId
    }
    if (lang) {
      store.lang = lang
    }
    stores.push(store)
  } else {
    // try to set store from HTML DOM
    let domStores = document.getElementsByClassName('_ecom-store')
    if (typeof domStores === 'object' && domStores !== null) {
      for (let i = 0; i < domStores.length; i++) {
        let el = domStores[i]
        let store = { el }

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
  let promises = []
  stores.forEach(store => {
    promises.push(renderStore(store))
  })
  // return promise resolved when all stores are rendered
  return Promise.all(promises)
}

module.exports = { init, stores, render, methods }
