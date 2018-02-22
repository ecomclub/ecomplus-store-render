'use strict'

// global Ecom
window.Ecom = (function () {
  var stores = []

  var render = function (store) {
    // render store in the HTML DOM
  }

  return {
    'init': function (storeId, storeObjectId, lang) {
      var i, store

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
        var domStores = document.getElementsByClassName('_ecom-store')
        if (Array.isArray(domStores)) {
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
      for (i = 0; i < stores.length; i++) {
        render(stores[i])
      }
    },

    // return current stores array
    'stores': function () {
      return stores
    }
  }
}())
