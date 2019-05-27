'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')
// render specific element
const render = require('./../')
// handle items search through Search API
const searchItems = require('./search')

exports.add = (queue, el, resource, resourceId, listAll, currentId, graphsApi) => {
  let index
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
      resource: resource,
      id: resourceId,
      list: listAll,
      current: currentId,
      els: [ el ],
      graphs: graphsApi
    }
  }
}

exports.run = (store, queue, currentObj) => {
  // get location object
  const { location } = require('./../../lib/dom')
  // one promise for each queue object
  let promises = []

  let ioMethod
  for (let index in queue) {
    if (queue.hasOwnProperty(index)) {
      promises.push(new Promise(resolve => {
        let get = queue[index]
        // request options
        let resource = get.resource
        let resourceId = get.id
        let graphsApi = get.graphs
        let els = get.els

        let callback = (err, body) => {
          if (!err) {
            // one promise for each element on current queue object
            let promises = []

            els.forEach(el => {
              if (graphsApi || el.dataset.hasOwnProperty('list')) {
                // search items by IDs from resource field
                let field = el.dataset.list
                let ids
                if (graphsApi) {
                  // parse Graphs API response to array
                  // https://developers.e-com.plus/docs/api/#/graphs/
                  ids = []
                  if (Array.isArray(body.results) && body.results.length) {
                    let data = body.results[0].data
                    if (data) {
                      data.forEach(obj => ids.push(obj.row))
                    }
                  }
                } else if (body.hasOwnProperty(field)) {
                  ids = body[field]
                }

                // set data-ids
                if (Array.isArray(ids)) {
                  // implode array with double bars separator (or)
                  el.dataset.ids = ids.join('||')
                } else if (typeof ids === 'string') {
                  // expect that the string already is a valid product object ID
                  el.dataset.ids = ids
                }

                // send request to Search API
                promises.push(searchItems(store, el, body))
              } else if (el.dataset.hasOwnProperty('searchBy') && body.name) {
                // search items with filter
                // set element data to handle ELS query
                el.dataset[el.dataset.searchBy] = body.name
                // send request to Search API
                promises.push(searchItems(store, el, body))
              } else {
                // simple Store API object
                promises.push(render(store, el, body))
              }
            })

            if (get.current && body._id && typeof Ecom === 'object') {
              // share current object globally
              /* global Ecom */
              Ecom.currentObject = body
            }

            // resolve parent promise after all elements
            Promise.all(promises).then(resolve)
          } else {
            console.error(err)
            // resolve the promise anyway
            resolve()
          }
        }

        let invalidElement = msg => {
          if (typeof process === 'object') {
            // Node.js
            if (location && location.pathname) {
              msg += ' ' + location.pathname
            }
            console.log(msg)
          } else {
            // browser
            console.log(msg)
            console.log(get.els)
          }
          // resolve the promise anyway
          resolve()
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
              invalidElement('Ignored elements, id undefined and unmatched URI:')
            }
          } else {
            // list all resource objects
            // no resource ID
            ioMethod = 'list' + resource.charAt(0).toUpperCase() + resource.slice(1)

            if (EcomIo.hasOwnProperty(ioMethod)) {
              EcomIo[ioMethod](callback)
            } else {
              invalidElement('Ignored elements, list all unavailable:')
            }
          }
        } else {
          // handle requests to Graphs API
          ioMethod = resource === 'related'
            ? 'listRelatedProducts' : 'listRecommendedProducts'

          if (!get.current) {
            // product ID defined by element data
            EcomIo[ioMethod](callback, resourceId)
          } else if (currentObj.resource === 'products') {
            // current URI product object
            EcomIo[ioMethod](callback, currentObj._id)
          } else {
            invalidElement('Ignored elements, product id undefined for Graphs method:')
          }
        }
      }))
    }
  }

  // return new promise resolved after entire queue
  return Promise.all(promises)
}
