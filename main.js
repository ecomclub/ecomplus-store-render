window.Ecom = (function () {
  'use strict'

  var stores = []

  /* auxiliary methods */

  var splitImgSize = function (imgBody, index) {
    if (typeof imgBody === 'object' && imgBody !== null) {
      if (imgBody.hasOwnProperty('size')) {
        var sizes = imgBody.size.split('x')
        if (sizes.length === 2) {
          return sizes[index]
        }
      } else {
        // try with 'logo' body property by default
        return splitImgSize(imgBody.logo)
      }
    }
    return null
  }

  // Ecom utility methods
  var methods = {
    'name': function (body, lang) {
      if (!lang && typeof this === 'object' && this !== null && this.Store) {
        // this is the Vue instance
        // default store lang
        lang = this.Store.lang
      }

      // prefer translated item name
      if (lang && body.hasOwnProperty('i18n') && body.i18n.hasOwnProperty(lang)) {
        return body.i18n[lang]
      } else {
        return body.name
      }
    },

    'width': function (imgBody) {
      // returns image width in px from size string
      splitImgSize(imgBody, 0)
    },

    'height': function (imgBody) {
      // returns image height from size string
      splitImgSize(imgBody, 1)
    },

    'price': function (body) {
      // prefer promotional price
      if (body.hasOwnProperty('price')) {
        // sale price
        return body.price
      } else {
        return body.base_price
      }
    },

    'formatMoney': function (price, decimal, thousands, numFixed) {
      // set defaults
      if (!decimal) {
        decimal = ','
      }
      if (!thousands) {
        thousands = '.'
      }
      if (!numFixed) {
        numFixed = 2
      }

      // price to number
      if (typeof price === 'object') {
        if (price !== null) {
          // suppose to be product object
          price = price.price
        }
      } else if (typeof price === 'string') {
        price = parseFloat(price)
      }
      // format price string
      if (typeof price === 'number' && !isNaN(price)) {
        return price.toFixed(numFixed).replace(thousands, decimal).replace(/(\d)(?=(\d{3})+,)/g, '$1.')
      } else {
        // eg.: 0,00
        var zero = '0' + decimal
        for (var i = 0; i < numFixed; i++) {
          zero += '0'
        }
        return zero
      }
    },

    'onPromotion': function (body) {
      if (body.hasOwnProperty('price_effective_date')) {
        var now = new Date()
        if (body.price_effective_date.hasOwnProperty('start')) {
          // start date and time in ISO 8601
          if (new Date(body.price_effective_date.start) < now) {
            return false
          }
        }
        if (body.price_effective_date.hasOwnProperty('end')) {
          // promotion end date and time in ISO 8601
          if (new Date(body.price_effective_date.end) > now) {
            return false
          }
        }
      }

      if (body.price && body.base_price) {
        return true
      }
      // default to no promotion
      return false
    },

    'alphabeticalSort': function (list) {
      // must be an array
      if (Array.isArray(list)) {
        // try to sort by name
        list.sort(function (a, b) {
          if (a.name < b.name) return -1
          return 1
        })
      } else if (typeof list === 'object' && list !== null) {
        // suppose to be a list all request body
        return methods.alphabeticalSort(list.results)
      }
      return list
    }
  }

  // Ecom methods for Vue instance
  var vueEcom = {
    'methods': {}
  }
  for (var method in methods) {
    if (methods.hasOwnProperty(method)) {
      vueEcom.methods[method] = function () {
        // convert arguments array-like object to array
        var args = []
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i])
        }
        if (!args[0]) {
          // body
          // send instance data
          args[0] = this.$data
        }

        // call global method
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
        return methods[method].apply(null, args)
      }
    }
  }
  // predefined Vue instances ontions with mixin
  var vueMixins = [ vueEcom ]

  var findChildsByClass = function (doc, className, els) {
    // returns array of DOM elements
    if (!Array.isArray(els)) {
      els = []
    }

    if (doc.childNodes) {
      for (var i = 0; i < doc.childNodes.length; i++) {
        var el = doc.childNodes[i]
        var classes = el.classList
        if (classes) {
          for (var ii = 0; ii < classes.length; ii++) {
            if (classes[ii] === className) {
              // match
              // el.deep = deep
              els.push(el)
              break
            }
          }
        }

        // go deeper
        // recursive function
        findChildsByClass(el, className, els)
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
              if (resource === 'stores') {
                // get current store info
                resourceId = store.store_object_id
                toQueue()
              } else {
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
              }
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
      console.log('Init storefront SDK for #' + store.store_id)
      EcomIo.init(callback, store.store_id, store.store_object_id)
    } else {
      // set store in function of site domain name
      console.log('Init storefront SDK for self host')
      EcomIo.init(callback)
    }
  }

  var renderElement = function (store, el, body) {
    // pass store properties to instance data
    body.Store = store
    var vm = new Vue({
      'mixins': vueMixins,
      'el': el,
      'data': {
        'body': body
      }
    })
    // destroy Vue instace after element rendering
    vm.$destroy()
    // mark element as rendered
    el.classList.add('rendered')
  }

  methods.init = function (VueMixins, StoreId, StoreObjectId, Lang) {
    var i, store

    console.log('Init E-Com Plus store rendering')
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
