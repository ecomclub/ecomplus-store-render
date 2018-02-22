window.Ecom = (function () {
  'use strict'

  var stores = []

  var findChildsByClass = function (doc, className) {
    // returns array of DOM elements
    var els = []
    for (var i = 0; i < doc.childNodes.length; i++) {
      var classes = doc.childNodes[i].classList
      if (Array.isArray(classes)) {
        for (var ii = 0; ii < classes.length; ii++) {
          if (classes[ii] === className) {
            // match
            els.push(doc.childNodes[i])
            break
          }
        }
      }
    }
    return els
  }

  var render = function (store) {
    // render store in the HTML DOM
    var doc
    if (store.hasOwnProperty('el')) {
      doc = store.el
    } else {
      // <body>
      doc = document.getElementsByTagName('BODY')[0]
    }

    var callback = function (err, body) {
      if (!err) {
        // render elements
        // https://developers.e-com.plus/ecomplus-store-template/#vue-instances
        var els = findChildsByClass(doc, '_ecom-el')
        for (var i = 0; i < els.length; i++) {
          var vm = new Vue({
            el: els[i],
            data: {
              'message': 'Hello'
            }
          })
          // destroy Vue instace after element rendering
          vm.$destroy()
        }
      } else {
      }
    }

    // initialize storefront SDK
    if (store.hasOwnProperty('store_id') && store.hasOwnProperty('store_object_id')) {
      EcomIo.init(callback, store.store_id, store.store_object_id)
    } else {
      // set store in function of site domain name
      EcomIo.init(callback)
    }
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
