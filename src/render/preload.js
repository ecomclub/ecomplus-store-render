'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')

// save promises by Store ID
const byStore = {}

module.exports = storeId => {
  if (!byStore[storeId]) {
    byStore[storeId] = new Promise(resolve => {
      // get list of grids
      let callback = (err, body) => {
        let grids = []
        if (err) {
          console.error(err)
        } else {
          grids = body.result
        }

        // resolve the promise anyway
        // pass object with grids property (array)
        resolve({ grids })
      }

      // run custom request from SDK http client
      let endpoint = '/grids.json'
      EcomIo.http(callback, endpoint)
    })
  }
  return byStore[storeId]
}
