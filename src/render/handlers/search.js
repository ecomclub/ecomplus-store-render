'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')
// render specific element
const render = require('./../')

module.exports = (store, el, presetBody) => {
  // check for search arguments
  const args = {}
  for (let data in el.dataset) {
    if (el.dataset.hasOwnProperty(data)) {
      // filter value
      let value = el.dataset[data]
      switch (data) {
        case 'term':
          args[data] = value
          break

        case 'from':
        case 'size':
        case 'sort':
          args[data] = parseInt(value, 10)
          break

        case 'ids':
        case 'brands':
        case 'categories':
          // list separated by double bars
          // to array
          args[data] = value.split('||')
          break

        case 'priceMin':
        case 'priceMax':
          if (!args.hasOwnProperty('prices')) {
            // preset object
            args.prices = {}
          }
          // eg.: \priceM\in -> min
          args.prices['m' + data.substr(6)] = parseFloat(value)
          break

        default:
          // check specs
          if (data.startsWith('spec')) {
            if (!args.hasOwnProperty('specs')) {
              // preset object
              args.specs = {}
            }
            // lowercase specification name
            // eg.: \spec\Colors -> colors
            let spec = data.charAt(4).toLowerCase() + data.substr(5)
            // list separated by double bars
            // specification values array
            args.specs[spec] = value.split('||')
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
      args.term,
      args.from,
      args.size,
      args.sort,
      args.specs,
      args.ids,
      args.brands,
      args.categories,
      args.prices
    )
  })
}
