/* global __ecom */

(function () {
  'use strict'

  // global objects
  var root = __ecom.root
  var Ecom = __ecom.Ecom
  var EcomIo = __ecom.EcomIo
  var Vue = __ecom.Vue

  // stores list
  var stores = []

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
    for (i = 0; i < stores.length; i++) {
      render(stores[i])
    }
  }
}())
