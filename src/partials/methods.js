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
      if (body.hasOwnProperty('price')) {
        // sale price
        return body.price
      } else {
        return body.base_price
      }
    },

    inStock: function (body) {
      // check inventory
      if (body.hasOwnProperty('quantity')) {
        var min
        if (body.hasOwnProperty('min_quantity')) {
          min = body.min_quantity
        } else {
          min = 1
        }
        if (body.quantity >= min) {
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
          price = price.price
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

      if (body.price && body.base_price) {
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
    }
  }

  // add methods to Ecom Vue mixin
  for (var method in methods) {
    if (methods.hasOwnProperty(method)) {
      add(method, methods[method])
    }
  }
}())
