/**
 * https://github.com/ecomclub/ecomplus-store-render
 * @author E-Com Club <ti@e-com.club>
 * @license MIT
 */

// set auxiliar global object
var __ecom = {};

(function () {
  'use strict'

  /*
    Handle compatibility with Node.js, RequireJS as well as without them
    No bundlers or transpilers
    Based on UnderscoreJS implementation:
    https://github.com/jashkenas/underscore/blob/master/underscore.js
  */

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  /* global self */
  var root = (typeof self === 'object' && self.self === self && self) ||
             (typeof global === 'object' && global.global === global && global) ||
             this ||
             {}

  // main object
  var Ecom = {}
  __ecom = {
    Ecom: Ecom,
    root: root
  }

  // load dependencies
  var libs = {
    Vue: 'vue',
    EcomIo: 'ecomplus-sdk'
  }
  for (var lib in libs) {
    if (libs.hasOwnProperty(lib)) {
      var pack = libs[lib]

      // handle require function with compatibility
      if (root.hasOwnProperty(lib)) {
        // get from global
        __ecom[lib] = root[lib]
      } else if (typeof require === 'function') {
        // require module
        __ecom[lib] = require(pack)
      } else {
        console.error(lib + ' (`' + pack + '`) is required and undefined')
        return
      }
    }
  }

  // Export the Ecom object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `Ecom` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports !== 'undefined' && !exports.nodeType) {
    // handle exports
    if (typeof module !== 'undefined' && module.exports && !module.nodeType) {
      exports = module.exports = Ecom
    }
    exports.Ecom = Ecom
  } else {
    // set object on root
    root.Ecom = Ecom
  }
}())

// concatenate scripts
// require('partials/**')
;

/* global __ecom */

(function () {
  'use strict'

  // global objects
  var root = __ecom.root
  var Ecom = __ecom.Ecom
  var EcomIo = __ecom.EcomIo
  if (!Ecom || !EcomIo) {
    // dependencies error
    return
  }
  var Vue = __ecom.Vue

  // stores list
  var stores = []

  // callback after renderization
  var todo, done, cb

  // Ecom methods for Vue instance
  // set Vue mixin
  var vueEcom = {
    methods: {}
  }
  Ecom.addVueMethod = function (name, func) {
    vueEcom.methods[name] = (function () {
      // scoped
      return function () {
        // convert arguments array-like object to array
        var args = []
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i])
        }
        if (!args[0]) {
          // body
          // send from instance data
          args[0] = this.$data.body
        }

        // call global method
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
        return func.apply(null, args)
      }
    }())
  }

  // config Vue globally
  Vue.config.errorHandler = function (err, vm, info) {
    console.error(err)
    // identify the instance
    console.log('Vue instance with error, $el and $data:')
    console.log(vm.$el)
    console.log(vm.$data)
    console.log(info)
    console.log('-----//-----')
  }

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
      doc = root['document'].getElementsByTagName('BODY')[0]
    }

    var callback = function (err, body) {
      if (!err) {
        var i, el

        if (typeof body === 'object' && body !== null) {
          // returned body from domains resource of Main API
          // http://ecomplus.docs.apiary.io/
          store.store_id = body.store_id
          store.store_object_id = body.store_object_id
          if (!store.lang && body.default_lang) {
            // use domain default language
            store.lang = body.default_lang
          }
        }

        // render elements
        // https://developers.e-com.plus/ecomplus-store-template/#vue-instances
        var els = findChildsByClass(doc, '_ecom-el')

        // resources queue
        var queue = {}
        var resource, resourceId, listAll, currentId, getCurrentObj

        for (i = 0; i < els.length; i++) {
          el = els[i]
          var skip = false
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

            case 'items':
              // Search API
              searchItems(store, el)
              skip = true
              break

            default:
              console.log('Ignored element, invalid type:')
              console.log(el)
              skip = true
          }
          if (skip === true) {
            continue
          }

          // preset defaults
          listAll = currentId = false
          // try to define resource ID by element data
          resourceId = el.dataset.id
          if (!resourceId) {
            if (resource === 'stores') {
              // get current store info
              resourceId = store.store_object_id
            } else if (el.dataset.hasOwnProperty('listAll')) {
              // list all objects
              listAll = true
            } else {
              // use object of current URI
              if (!getCurrentObj) {
                getCurrentObj = true
              }
              currentId = true
            }
          }

          addToQueue(queue, el, resource, resourceId, listAll, currentId)
        }

        // reset elements counter
        todo = done = 0

        // start elements queue
        if (getCurrentObj === true) {
          // get resource ID by current URI
          EcomIo.mapByWindowUri(function (err, body) {
            if (!err) {
              runQueue(store, queue, body)
            } else {
              console.error(err)
            }
          })
        } else {
          // just run the queue
          runQueue(store, queue)
        }
      } else {
        console.error(err)
      }
    }

    // initialize storefront SDK
    if (store.hasOwnProperty('store_id') && store.hasOwnProperty('store_object_id')) {
      // console.log('Init storefront SDK for #' + store.store_id)
      EcomIo.init(callback, store.store_id, store.store_object_id)
    } else {
      // set store in function of site domain name
      EcomIo.init(callback)
    }
  }

  var addToQueue = function (queue, el, resource, resourceId, listAll, currentId) {
    var index
    if (!listAll && !currentId) {
      index = resourceId
    } else {
      // list all resource objects or use object of current URI
      // no resource ID
      index = resource
    }

    if (queue.hasOwnProperty(index)) {
      if (queue[index].resource === resource) {
        queue[index].els.push(el)
      } else {
        console.log('Ignored element, different types for same id (?):')
        console.log(el)
      }
    } else {
      // set on queue
      queue[index] = {
        'resource': resource,
        'list': listAll,
        'current': currentId,
        'els': [ el ]
      }
    }
  }

  var runQueue = function (store, queue, currentObj) {
    for (var resourceId in queue) {
      if (queue.hasOwnProperty(resourceId)) {
        var get = queue[resourceId]
        var resource = get.resource

        var callback = (function () {
          // scoped
          var els = get.els
          return function (err, body) {
            if (!err) {
              for (var i = 0; i < els.length; i++) {
                var el = els[i]

                if (el.dataset.hasOwnProperty('list')) {
                  // search items by IDs from resource field
                  var field = el.dataset.list
                  if (body.hasOwnProperty(field)) {
                    var ids = body[field]
                    // set data-ids
                    if (Array.isArray(ids)) {
                      // implode array with separator ,
                      el.dataset.ids = ids.join()
                    } else if (typeof ids === 'string') {
                      // expect that the string already is a valid product object ID
                      el.dataset.ids = ids
                    }
                  }
                  searchItems(store, el, body)
                } else {
                  // simple Store API object
                  renderElement(store, el, body)
                }
              }
            } else {
              console.error(err)
            }
          }
        }())

        if (!get.list) {
          if (!get.current) {
            // resource ID defined by element data
            EcomIo.getById(callback, resource, resourceId)
          } else if (resource === currentObj.resource) {
            // current URI resource object
            EcomIo.getById(callback, resource, currentObj._id)
          } else {
            console.log('Ignored elements, id undefined and type does not match with URI resource:')
            console.log(get.els)
          }
        } else {
          // list all resource objects
          // no resource ID
          var ioMethod = 'list' + resource.charAt(0).toUpperCase() + resource.slice(1)
          if (EcomIo.hasOwnProperty(ioMethod)) {
            EcomIo[ioMethod](callback)
          } else {
            console.log('Ignored elements, list all unavailable for this resource:')
            console.log(get.els)
          }
        }

        // count global todo
        // more one element
        todo++
      }
    }
  }

  var searchItems = function (store, el, presetBody) {
    // check for search arguments
    var arg = {}
    for (var data in el.dataset) {
      if (el.dataset.hasOwnProperty(data)) {
        switch (data) {
          case 'term':
            arg[data] = el.dataset[data]
            break

          case 'from':
          case 'size':
          case 'sort':
            arg[data] = parseInt(el.dataset[data], 10)
            break

          case 'ids':
          case 'brands':
          case 'categories':
            // list separated by ,
            // to array
            arg[data] = el.dataset[data].split(',')
            break

          case 'priceMin':
            if (!arg.hasOwnProperty('prices')) {
              // preset object
              arg.prices = {}
            }
            arg.prices.min = parseFloat(el.dataset[data])
            break

          case 'priceMax':
            if (!arg.hasOwnProperty('prices')) {
              // preset object
              arg.prices = {}
            }
            arg.prices.max = parseFloat(el.dataset[data])
            break

          default:
            // check specs
            if (data.startsWith('spec')) {
              if (!arg.hasOwnProperty('specs')) {
                // preset object
                arg.specs = {}
              }
              // lowercase specification name
              // eg.: specColors -> colors
              var spec = data.charAt(4).toLowerCase() + data.substr(5)
              // specification value
              var value = el.dataset[data]

              if (value.charAt(0) === '[') {
                // can be a JSON array
                try {
                  var array = JSON.parse(value)
                  if (Array.isArray(array)) {
                    arg.specs[spec] = array
                  }
                } catch (e) {
                  // continue only
                }
              }
              if (!arg.specs.hasOwnProperty(spec)) {
                arg.specs[spec] = [ value ]
              }
            }
        }
      }
    }

    // call Search API
    EcomIo.searchProducts(function (err, body) {
      if (!err) {
        // console.log(body)
        if (typeof presetBody === 'object' && presetBody !== null) {
          // some Store API resource body
          // merge with Search API response
          body = Object.assign(presetBody, body)
        }
        renderElement(store, el, body)
      } else {
        console.error(err)
      }
    }, arg.term, arg.from, arg.size, arg.sort, arg.specs, arg.ids, arg.brands, arg.categories, arg.prices)
  }

  var renderElement = function (store, el, body) {
    // pass store properties to instance data
    body.Store = store

    // create new Vue instance
    var vm = new Vue({
      'mixins': [ vueEcom ],
      'el': el,
      'data': {
        'body': body
      },
      'destroyed': function () {
        // mark element as rendered
        var el = this.$el
        if (typeof el === 'object' && el !== null && el.classList) {
          el.classList.add('rendered')
        }

        // element done
        done++
        if (done === todo && typeof cb === 'function') {
          cb()
        }
      }
    })

    // destroy Vue instace after element rendering
    vm.$destroy()
  }

  // return current stores array
  Ecom.stores = function () {
    return stores
  }

  Ecom.init = function (callback, storeId, storeObjectId, lang, doc) {
    var i, store

    console.log('Init E-Com Plus store rendering')
    if (doc) {
      // for NodeJs only
      // set doc with jsdom or similar
      root['document'] = doc
    } else if (!root['document']) {
      console.error('Root `document` (DOM) object is undefined or invalid')
      return
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
}())
;

/* global __ecom */

(function () {
  'use strict'

  // global objects
  var Ecom = __ecom.Ecom
  if (!Ecom) {
    // dependencies error
    return
  }
  var add = Ecom.addVueMethod
  if (typeof add !== 'function') {
    // should be a function
    // previous fatal error
    return
  }

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
    name: function (body, lang) {
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

    width: function (imgBody) {
      // returns image width in px from size string
      splitImgSize(imgBody, 0)
    },

    height: function (imgBody) {
      // returns image height from size string
      splitImgSize(imgBody, 1)
    },

    price: function (body) {
      // prefer promotional price
      if (body.hasOwnProperty('price')) {
        // sale price
        return body.price
      } else {
        return body.base_price
      }
    },

    inStock: function (body) {
      // check inventory
      if (body.hasOwnProperty('quantity')) {
        var min
        if (body.hasOwnProperty('min_quantity')) {
          min = body.min_quantity
        } else {
          min = 1
        }
        if (body.quantity >= min) {
          // in stock
          return true
        }
      } else {
        // no stock control
        return true
      }
      // out of stock
      return false
    },

    formatMoney: function (price, decimal, thousands, numFixed) {
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

    onPromotion: function (body) {
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

    alphabeticalSort: function (list) {
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

  // add methods to Ecom Vue mixin
  for (var method in methods) {
    if (methods.hasOwnProperty(method)) {
      add(method, methods[method])
    }
  }
}())
