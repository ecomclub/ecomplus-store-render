'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')
// render specific element
const render = require('./../')

module.exports = (store, el, presetBody) => {
  // check for search arguments
  const arg = {}
  for (let data in el.dataset) {
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
            let spec = data.charAt(4).toLowerCase() + data.substr(5)
            // specification value
            let value = el.dataset[data]

            if (value.charAt(0) === '[') {
              // can be a JSON array
              try {
                let array = JSON.parse(value)
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

  return new Promise(resolve => {
    let searchCallback = (err, body) => {
      if (!err) {
        // console.log(body)
        if (typeof presetBody === 'object' && presetBody !== null) {
          // some Store API resource body
          // merge with Search API response
          body = Object.assign(presetBody, body)
        }
        render(store, el, body).then(resolve)
      } else {
        console.error(err)
        // resolve the promise anyway
        resolve()
      }
    }

    // call Search API
    EcomIo.searchProducts(
      searchCallback,
      arg.term,
      arg.from,
      arg.size,
      arg.sort,
      arg.specs,
      arg.ids,
      arg.brands,
      arg.categories,
      arg.prices
    )
  })
}
