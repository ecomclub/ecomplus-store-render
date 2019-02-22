'use strict'

// E-Com Plus storefront SDK
const EcomIo = require('ecomplus-sdk')
// render specific element
const render = require('./../')

// handle persist search history data on browser
// check localStorage browser support
/* global localStorage */
const DB_HISTORY = typeof localStorage === 'object' ? 'ecomSeachHistory' : null

// reusable load body function
const load = (callback, args, payload) => {
  // prevent search with empty term (no results)
  let term = args.term && args.term.trim()
  if (term === '') {
    term = null
  }
  // reset suggested term
  payload.suggested = null

  let searchCallback = (err, body) => {
    if (!err && term) {
      if (body.hits.total > 0) {
        if (payload.history) {
          // add searched term to history list
          if (payload.history.indexOf(args.term) === -1) {
            payload.history.push(args.term)

            // update browser localStorage data
            if (DB_HISTORY) {
              localStorage.setItem(DB_HISTORY, payload.history.join('||'))
            }
          }
        }
      } else if (payload.retry && body.suggest) {
        // search with no results
        // try with suggested fixed words
        let retryTerm = term
        body.suggest[Object.keys(body.suggest)[0]].forEach(word => {
          if (word.options && word.options.length) {
            retryTerm = retryTerm.replace(word.text, word.options[0].text)
          }
        })

        if (retryTerm !== term) {
          // try to search with new (fixed) term
          search(retryTerm)
          payload.suggested = retryTerm
        } else {
          // search without term filter
          search()
          payload.suggested = ''
        }
        return
      }
    }

    // proceed to callback with search results
    callback(err, body)
  }

  let search = term => {
    // call Search API
    EcomIo.searchProducts(
      searchCallback,
      term,
      args.from,
      args.size,
      args.sort,
      args.specs,
      args.ids,
      args.brands,
      args.categories,
      args.prices
    )
  }
  search(term)
}

const searchItems = (store, el, presetBody) => {
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

  // booleans to config search engine
  let retry, history
  // defaults to true
  retry = el.dataset.searchRetry !== 'false'

  // handle searched terms history
  if (el.dataset.searchHistory !== 'false') {
    // try to get from saved history browser localStorage
    if (DB_HISTORY) {
      history = localStorage.getItem(DB_HISTORY)
      if (typeof history === 'string') {
        history = history.split('||')
      }
    }
    if (!Array.isArray(history)) {
      // new search history list
      history = []
    }
  } else {
    history = false
  }

  // setup additional payload for instance data
  let payload = { retry, history }

  return new Promise(resolve => {
    let searchCallback = (err, body) => {
      if (!err) {
        // console.log(body)
        if (typeof presetBody === 'object' && presetBody !== null) {
          // some Store API resource body
          // merge with Search API response
          body = Object.assign(presetBody, body)
        }
        render(store, el, body, load, args, payload).then(resolve)
      } else {
        console.error(err)
        // resolve the promise anyway
        resolve()
      }
    }
    // first body load
    load(searchCallback, args, payload)
  })
}

module.exports = searchItems
