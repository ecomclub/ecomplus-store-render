window.Ecom = (function () {
  'use strict'

  var stores = []

  // global Ecom utility methods
  var methods = {
    'name': function (store, body) {
      // prefer translated item name
      var lang = store.lang
      if (lang && body.hasOwnProperty('i18n') && body.i18n.hasOwnProperty(lang)) {
        return body.i18n[lang]
      } else {
        return body.name
      }
    }
  }

  // Ecom methods for Vue instance
  var vueEcom = {
    'methods': {}
  }
  for (var method in methods) {
    if (methods.hasOwnProperty(method)) {
      vueEcom.methods[method] = function (body) {
        if (!body) {
          // send instance data
          body = this.$data
        }
        // call global method
        return methods[method](this.Store, body)
      }
    }
  }
  // predefined Vue instances ontions with mixin
  var vueMixins = [ vueEcom ]

  var findChildsByClass = function (doc, className, els, deep) {
    // returns array of DOM elements
    if (!Array.isArray(els)) {
      els = []
      // count number of parents until the doc element
      if (!deep) {
        deep = 0
      }
    }

    if (doc.childNodes) {
      for (var i = 0; i < doc.childNodes.length; i++) {
        var el = doc.childNodes[i]
        var classes = el.classList
        if (classes) {
          for (var ii = 0; ii < classes.length; ii++) {
            if (classes[ii] === className) {
              // match
              el.deep = deep
              els.push(el)
              break
            }
          }
        }

        // go deeper
        // recursive function
        findChildsByClass(el, className, els, deep + 1)
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
        var i, el

        if (typeof body === 'object' && body !== null) {
          // returned body from domains resource of Main API
          // http://ecomplus.docs.apiary.io/
          store.store_id = body.store_id
          store.store_object_id = body.store_object_id
        }

        // render elements
        // https://developers.e-com.plus/ecomplus-store-template/#vue-instances
        var els = findChildsByClass(doc, '_ecom-el')
        // order elements by number of parents
        // deeper first
        els.sort(function (x, y) {
          return y.deep - x.deep
        })

        // resources queue
        var queue = {}
        var resourceId
        var resource
        var toQueue = function () {
          if (queue.hasOwnProperty(resourceId)) {
            if (queue[resourceId].resource === resource) {
              queue[resourceId].els.push(el)
            } else {
              console.log('Ignored element, different types for same id (?):')
              console.log(el)
            }
          } else {
            // set on queue
            queue[resourceId] = {
              'resource': resource,
              'els': [ el ]
            }
          }
        }

        for (i = 0; i < els.length; i++) {
          el = els[i]
          switch (el.dataset.type) {
            case 'product':
            case 'brand':
            case 'collection':
            case 'customer':
            case 'cart':
            case 'order':
            case 'application':
            case 'store':
              // eg.: products
              resource = el.dataset.type + 's'
              break
            case 'category':
              resource = el.dataset.type.slice(0, -1) + 'ies'
              break
          }

          if (resource !== undefined) {
            resourceId = el.dataset.id
            if (!resourceId) {
              // get resource ID by current URI
              EcomIo.mapByWindowUri(function (err, body) {
                if (!err) {
                  if (resource === body.resource) {
                    resourceId = body._id
                    toQueue()
                  } else {
                    console.log('Ignored element, id undefined and type does not match with URI resource:')
                    console.log(el)
                  }
                } else {
                  console.error(err)
                }
              })
            } else {
              // resource ID defined by element data
              toQueue()
            }
          } else {
            console.log('Ignored element, invalid type:')
            console.log(el)
          }
        }

        // run queue
        for (resourceId in queue) {
          if (queue.hasOwnProperty(resourceId)) {
            var get = queue[resourceId]
            callback = function (err, body) {
              if (!err) {
                els = get.els
                for (i = 0; i < els.length; i++) {
                  renderElement(store, els[i], body)
                }
              } else {
                console.error(err)
              }
            }
            EcomIo.getById(callback, get.resource, resourceId)
          }
        }
      } else {
        console.error(err)
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

  var renderElement = function (store, el, body) {
    // pass store properties to instance data
    body.Store = store
    var vm = new Vue({
      'mixins': vueMixins,
      'el': el,
      'data': body
    })
    // destroy Vue instace after element rendering
    vm.$destroy()
    // mark element as rendered
    el.classList.add('rendered')
  }

  methods.init = function (VueMixins, StoreId, StoreObjectId, Lang) {
    var i, store

    if (StoreId && StoreObjectId) {
      // set store from function arguments
      store = {
        'store_id': parseInt(StoreId, 10),
        'store_object_id': StoreObjectId
      }
      if (Lang) {
        store.lang = Lang
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

    if (Array.isArray(VueMixins)) {
      // merge with predefined mixins on higher scope
      for (i = 0; i < VueMixins.length; i++) {
        vueMixins.push(VueMixins[i])
      }
    }
    // start rendering
    for (i = 0; i < stores.length; i++) {
      render(stores[i])
    }
  }

  // return current stores array
  methods.stores = function () {
    return stores
  }

  return methods
}())
