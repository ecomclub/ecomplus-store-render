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
            if (url) {
              // try to get resource ID from backend cookies
              currentObj.resource = getCookie('Ecom.' + url + ':resource')
              currentObj._id = getCookie('Ecom.' + url + ':_id')
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
