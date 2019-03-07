'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')
// DOM object with document and location
const dom = require('./../lib/dom')
// utility fnctions
const { getCookie, findChildsByClass } = require('./../lib/utils')
// preload grids reusable data
const grids = require('./../data/grids')
// handle items search through Search API
const searchItems = require('./handlers/search')
// handle Graphs API and Store API by queue
const handleQueue = require('./handlers/queue')

module.exports = store => {
  // render store in the HTML DOM
  // search for nested objects inside store container
  let container
  if (store.hasOwnProperty('el')) {
    container = store.el
  } else {
    // get document object
    // <body>
    container = dom.document.body
  }

  // return promise resolved after all elements
  return new Promise((resolve, reject) => {
    let sdkCallback = (err, body) => {
      if (err) {
        console.error(err)
        // reject init promise
        reject(err)
      } else {
        // one promise for each element to be rendered
        let promises = []

        if (typeof body === 'object' && body !== null) {
          // returned body from domains resource of Main API
          // https://developers.e-com.plus/docs/reference/main/
          store.store_id = body.store_id
          store.store_object_id = body.store_object_id
          if (!store.lang && body.default_lang) {
            // use domain default language
            store.lang = body.default_lang
          }
        }

        // preload data by store ID
        // handle preload concurrently with elements rendering
        promises.push(grids(store.store_id))

        // render elements
        // https://developers.e-com.plus/ecomplus-store-template/#vue-instances
        let els = findChildsByClass(container, '_ecom-el')

        // resources queue
        let queue = {}
        let resource, resourceId, listAll, currentId, getCurrentObj

        for (let i = 0; i < els.length; i++) {
          let el = els[i]
          let graphsApi = false
          let skip = false
          let type = el.dataset.type

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
              promises.push(searchItems(store, el))
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
          handleQueue.add(queue, el, resource, resourceId, listAll, currentId, graphsApi)
        }

        // start elements queue
        if (getCurrentObj === true) {
          var currentObj = {}
          if (dom.location) {
            var url = dom.location.pathname
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
                promises.push(handleQueue.run(store, queue, body))
              } else {
                console.error(err)
              }
            })
          } else {
            // current object already setted
            promises.push(handleQueue.run(store, queue, currentObj))
          }
        } else {
          // just run the queue
          promises.push(handleQueue.run(store, queue))
        }

        // resolve init promise after all elements
        Promise.all(promises).then(resolve)
      }
    }

    // store IDs undefineds, try to get from backend cookies
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
    EcomIo.init(sdkCallback, store.store_id, store.store_object_id)
  })
}
