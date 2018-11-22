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
    root: root,
    // utility functions
    _: {}
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
  var utils = __ecom._

  // get cookie value by cookie name
  utils.getCookie = function (cname) {
    // check for document cookies
    var cookies = root['document'].cookie

    if (typeof cookies === 'string') {
      // Ref.: https://www.w3schools.com/js/js_cookies.asp
      var name = cname + '='
      var decodedCookie = decodeURIComponent(cookies)
      var ca = decodedCookie.split(';')
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i]
        while (c.charAt(0) === ' ') {
          c = c.substring(1)
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length)
        }
      }
    }

    // cookie not found
    // returns null by default
    return null
  }
}())
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
  // utility functions
  var getCookie = __ecom._.getCookie

  // stores list
  var stores = []

  // callback after renderization
  var todo, done, cb
  var checkAllDone = function () {
    // element finished
    done++
    if (done === todo && typeof cb === 'function') {
      cb()
    }
  }

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
        if (!args[0] && this.$data) {
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
        // reset elements counter
        todo = done = 0

        // resources queue
        var queue = {}
        var resource, resourceId, listAll, currentId, getCurrentObj

        for (i = 0; i < els.length; i++) {
          el = els[i]
          var graphsApi = false
          var skip = false
          var type = el.dataset.type

          // handle resource by element type
          switch (type) {
            case 'product':
            case 'brand':
            case 'collection':
            case 'customer':
            case 'cart':
            case 'order':
            case 'application':
            case 'store':
              // eg.: products
              resource = type + 's'
              break

            case 'category':
              resource = type.slice(0, -1) + 'ies'
              break

            case 'related':
            case 'recommended':
              // Graphs API
              graphsApi = true
              // also added to queue
              resource = type
              break

            case 'items':
              // Search API
              searchItems(store, el)
              // count more one todo
              todo++
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
            } else if (el.dataset.hasOwnProperty('listAll') && !graphsApi) {
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

          // schedule API request to element renderization
          addToQueue(queue, el, resource, resourceId, listAll, currentId, graphsApi)
        }

        // start elements queue
        if (getCurrentObj === true) {
          var currentObj = {}
          if (root['location']) {
            var url = root['location'].pathname
            if (url && url === getCookie('Ecom.current.path')) {
              // try to get resource ID from backend cookies
              currentObj.resource = getCookie('Ecom.current.resource')
              currentObj._id = getCookie('Ecom.current._id')
            }
          }

          if (!currentObj.resource || !currentObj._id) {
            // get resource ID by current URI
            EcomIo.mapByWindowUri(function (err, body) {
              if (!err) {
                runQueue(store, queue, body)
              } else {
                console.error(err)
              }
            })
          } else {
            // current object already setted
            runQueue(store, queue, currentObj)
          }
        } else {
          // just run the queue
          runQueue(store, queue)
        }
      } else {
        console.error(err)
      }
    }

    // is store IDs undefineds, try to get from backend cookies
    // https://github.com/ecomclub/dynamic-backend
    if (!store.hasOwnProperty('store_id')) {
      store.store_id = getCookie('Ecom.store_id')
    }
    if (store.store_id) {
      if (!store.hasOwnProperty('store_object_id')) {
        store.store_object_id = getCookie('Ecom.store_object_id')
      }
      if (!store.lang) {
        store.lang = getCookie('Ecom.default_lang')
      }
    }
    // initialize storefront SDK
    EcomIo.init(callback, store.store_id, store.store_object_id)
  }

  var addToQueue = function (queue, el, resource, resourceId, listAll, currentId, graphsApi) {
    var index
    if (!listAll && !currentId) {
      index = resourceId
    } else {
      // list all resource objects or use object of current URI
      // no resource ID
      index = resource
      if (currentId) {
        index += '&'
      }
    }
    if (graphsApi) {
      // request related or recommended products from Graphs API
      index = resource + '/' + index
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
        'id': resourceId,
        'list': listAll,
        'current': currentId,
        'els': [ el ],
        'graphs': graphsApi
      }
    }
  }

  var runQueue = function (store, queue, currentObj) {
    var ioMethod
    for (var index in queue) {
      if (queue.hasOwnProperty(index)) {
        (function () {
          // scoped
          var get = queue[index]
          // request options
          var resource = get.resource
          var resourceId = get.id
          var graphsApi = get.graphs
          var els = get.els

          var callback = function (err, body) {
            if (!err) {
              for (var i = 0; i < els.length; i++) {
                var el = els[i]

                if (graphsApi || el.dataset.hasOwnProperty('list')) {
                  // search items by IDs from resource field
                  var field = el.dataset.list
                  var ids
                  if (graphsApi) {
                    // parse Graphs API response to array
                    // https://developers.e-com.plus/docs/api/#/graphs/
                    ids = []
                    if (Array.isArray(body.results) && body.results.length) {
                      var data = body.results[0].data
                      if (data) {
                        for (var ii = 0; ii < data.length; ii++) {
                          ids.push(data[ii].row)
                        }
                      }
                    }
                  } else if (body.hasOwnProperty(field)) {
                    ids = body[field]
                  }

                  // set data-ids
                  if (Array.isArray(ids)) {
                    // implode array with separator ,
                    el.dataset.ids = ids.join()
                  } else if (typeof ids === 'string') {
                    // expect that the string already is a valid product object ID
                    el.dataset.ids = ids
                  }

                  // send request to Search API
                  searchItems(store, el, body)
                } else {
                  // simple Store API object
                  renderElement(store, el, body)
                }
              }

              if (get.current && body._id) {
                // share current object globally
                Ecom.currentObject = body
              }
            } else {
              console.error(err)
              // proceed to callback even with error
              checkAllDone()
            }
          }

          if (!graphsApi) {
            // default to Store API
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
              ioMethod = 'list' + resource.charAt(0).toUpperCase() + resource.slice(1)

              if (EcomIo.hasOwnProperty(ioMethod)) {
                EcomIo[ioMethod](callback)
              } else {
                console.log('Ignored elements, list all unavailable for this resource:')
                console.log(get.els)
              }
            }
          } else {
            // handle requests to Graphs API
            ioMethod = resource === 'related' ? 'listRelatedProducts' : 'listRecommendedProducts'

            if (!get.current) {
              // product ID defined by element data
              EcomIo[ioMethod](callback, resourceId)
            } else if (currentObj.resource === 'products') {
              // current URI product object
              EcomIo[ioMethod](callback, currentObj._id)
            } else {
              console.log('Ignored elements, product id undefined for Graphs method:')
              console.log(get.els)
            }
          }

          // count global todo
          // more elements
          todo += els.length
        }())
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
        // proceed to callback even with error
        checkAllDone()
      }
    }, arg.term, arg.from, arg.size, arg.sort, arg.specs, arg.ids, arg.brands, arg.categories, arg.prices)
  }

  var renderElement = function (store, el, body, callback) {
    // pass store properties to instance data
    if (store) {
      body.Store = store
    } else if (stores.length) {
      // use first recognized store
      body.Store = stores[0]
    }

    // handle element data
    var data = {
      'body': body
    }
    // get custom variables from data-payload
    if (el.dataset.hasOwnProperty('payload')) {
      try {
        data.payload = JSON.parse(el.dataset.payload)
      } catch (e) {
        console.log('Ignoring invalid element payload:')
        console.log(el)
      }
    }
    if (!Ecom.hasOwnProperty('currentObject') && el.dataset.current === 'true') {
      // force as current object
      Ecom.currentObject = body
    }

    // create new Vue instance
    var vm = new Vue({
      'mixins': [ vueEcom ],
      'el': el,
      'data': data,
      'destroyed': function () {
        // mark element as rendered
        var el = this.$el
        if (typeof el === 'object' && el !== null && el.classList) {
          el.classList.add('rendered')
        }

        // element done
        checkAllDone()
        if (typeof callback === 'function') {
          // handle custom callback for this current element only
          callback()
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

  // option to render specific elements manually
  Ecom.render = renderElement
  // export Vue instance available methods
  Ecom.methods = vueEcom.methods

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
      if (!body.hasOwnProperty('base_price') || methods.onPromotion(body)) {
        // sale price
        return body.price
      } else {
        return body.base_price
      }
    },

    minQuantity: function (body) {
      return body.min_quantity || 1
    },

    inStock: function (body) {
      // check inventory
      if (body.hasOwnProperty('quantity')) {
        if (body.quantity >= methods.minQuantity(body)) {
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
          price = methods.price(price)
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

      if (body.hasOwnProperty('price') && body.hasOwnProperty('base_price')) {
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
    },

    findByProperty: function (list, prop, value) {
      // must be an array
      if (Array.isArray(list)) {
        for (var i = 0; i < list.length; i++) {
          var obj = list[i]
          if (obj && obj[prop] === value) {
            // object found
            return obj
          }
        }
      }
      return undefined
    },

    findBySlug: function (list, slug) {
      // must be an array
      if (Array.isArray(list)) {
        return methods.findProperty(list, 'slug', slug)
      }
      return undefined
    },

    filterByParentSlug: function (categories, slug) {
      // for categories
      // filter by parent category slug
      var matchedCategories = []
      if (Array.isArray(categories)) {
        for (var i = 0; i < categories.length; i++) {
          var category = categories[i]
          if (category.parent && category.parent.slug === slug) {
            matchedCategories.push(category)
          }
        }
      }
      // returns array of macthed category objects
      return matchedCategories
    },

    specTextValue: function (body, spec, delimiter) {
      var specValues = []
      if (Array.isArray(body)) {
        // spec values list sent as body param
        specValues = body
      } else {
        var specifications = body.specifications
        if (specifications) {
          for (var grid in specifications) {
            if (specifications.hasOwnProperty(grid) && grid === spec) {
              // specification found
              specValues = specifications[grid]
            }
          }
        }
      }

      if (specValues.length) {
        var valuesString = specValues[0].text
        if (!delimiter) {
          // comma as default text delimiter
          delimiter = ', '
        }
        for (var i = 1; i < specValues.length; i++) {
          valuesString += delimiter + specValues[i].text
        }
        return valuesString
      }
      // specification not found
      return null
    },

    splitCategoryTree: function (body) {
      // parse category tree string to array
      var categories = []
      var categoryTree
      if (typeof body === 'string') {
        // category tree string already sent as body param
        categoryTree = body
      } else {
        categoryTree = body.category_tree
      }

      if (categoryTree) {
        categories = categoryTree.split('>')
        for (var i = 0; i < categories.length; i++) {
          // remove white spaces from names
          categories[i] = categories[i].trim()
        }
      }
      // return array of categories
      return categories
    },

    variationsGrids: function (body, filterGrids, delimiter) {
      // parse variations specifications to one object only
      var grids = {}
      if (body.hasOwnProperty('variations')) {
        for (var i = 0; i < body.variations.length; i++) {
          var variation = body.variations[i]
          var specifications = variation.specifications
          // abstraction to get spec text value
          var specValue = function (grid) {
            return methods.specTextValue(variation, grid, delimiter)
          }

          if (specifications) {
            // check if current variation specs match with filters
            if (filterGrids) {
              var skip = false
              for (var filter in filterGrids) {
                if (filterGrids.hasOwnProperty(filter)) {
                  if (!specifications[filter] || specValue(filter) !== filterGrids[filter]) {
                    // does not match filtered grid
                    // skip current variation
                    skip = true
                    break
                  }
                }
              }
              if (skip) {
                continue
              }
            }

            // get values from each variation spec
            for (var grid in specifications) {
              if (specifications.hasOwnProperty(grid)) {
                if (!grids.hasOwnProperty(grid)) {
                  grids[grid] = []
                }
                grids[grid].push(specValue(grid))
              }
            }
          }
        }
      }
      // returns parsed grid object
      return grids
    }
  }

  // add methods to Ecom Vue mixin
  for (var method in methods) {
    if (methods.hasOwnProperty(method)) {
      add(method, methods[method])
    }
  }
}())
