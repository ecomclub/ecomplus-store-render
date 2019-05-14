'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')

// save promises and grids by store ID
const stores = {}

module.exports = (storeId, returnsObject) => {
  if (!stores[storeId]) {
    stores[storeId] = {
      promise: new Promise(resolve => {
        // get list of grids
        let callback = (err, body) => {
          let grids = []
          if (err) {
            console.error(err)
          } else {
            grids = body.result
          }

          // resolve the promise anyway
          resolve(grids)
          // save the grids array
          stores[storeId].grids = grids
        }

        // run custom request with generic SDK list method
        let resource = 'grids'
        EcomIo.getList(callback, resource)
      })
    }
  }

  if (!returnsObject) {
    // returns the promise by default
    return stores[storeId].promise
  } else {
    // returns the respective grids array if any
    return stores[storeId].grids
  }
}
