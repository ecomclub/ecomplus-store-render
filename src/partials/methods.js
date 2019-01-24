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
      if (!body.hasOwnProperty('base_price') || methods.onPromotion(body)) {
        // sale price
        return body.price
      } else {
        return body.base_price
      }
    },

    minQuantity: function (body) {
      return body.min_quantity || 1
    },

    inStock: function (body) {
      // check inventory
      if (body.hasOwnProperty('quantity')) {
        if (body.quantity >= methods.minQuantity(body)) {
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
          price = methods.price(price)
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

      if (body.hasOwnProperty('price') && body.hasOwnProperty('base_price')) {
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
    },

    findByProperty: function (list, prop, value) {
      // must be an array
      if (Array.isArray(list)) {
        for (var i = 0; i < list.length; i++) {
          var obj = list[i]
          if (obj && obj[prop] === value) {
            // object found
            return obj
          }
        }
      }
      return undefined
    },

    findBySlug: function (list, slug) {
      // must be an array
      if (Array.isArray(list)) {
        return methods.findProperty(list, 'slug', slug)
      }
      return undefined
    },

    filterByParentSlug: function (categories, slug) {
      // for categories
      // filter by parent category slug
      var matchedCategories = []
      if (Array.isArray(categories)) {
        for (var i = 0; i < categories.length; i++) {
          var category = categories[i]
          if (category.parent && category.parent.slug === slug) {
            matchedCategories.push(category)
          }
        }
      }
      // returns array of macthed category objects
      return matchedCategories
    },

    splitCategoryTree: function (body) {
      // parse category tree string to array
      var categories = []
      var categoryTree
      if (typeof body === 'string') {
        // category tree string already sent as body param
        categoryTree = body
      } else {
        categoryTree = body.category_tree
      }

      if (categoryTree) {
        categories = categoryTree.split('>')
        for (var i = 0; i < categories.length; i++) {
          // remove white spaces from names
          categories[i] = categories[i].trim()
        }
      }
      // return array of categories
      return categories
    },

    specValues: function (body, grid) {
      // returns array of spec objects for specified grid
      var specValues = []
      if (Array.isArray(body)) {
        // spec values list sent as body param
        specValues = body
      } else {
        var specifications = body.specifications
        if (specifications) {
          for (var Grid in specifications) {
            if (specifications.hasOwnProperty(Grid) && Grid === grid) {
              // specification found
              specValues = specifications[grid]
            }
          }
        }
      }
      return specValues
    },

    specTextValue: function (body, grid, delimiter) {
      // parse specifications array of nested objects to string
      // using text property of each spec object
      var specValues = methods.specValues(body, grid)
      if (specValues.length) {
        var valuesString = specValues[0].text
        if (!delimiter) {
          // comma as default text delimiter
          delimiter = ', '
        }
        for (var i = 1; i < specValues.length; i++) {
          valuesString += delimiter + specValues[i].text
        }
        return valuesString
      }
      // specification not found
      return null
    },

    specValueByText: function (body, grid, text) {
      // get value property of spec object based on respective text
      var specValues = methods.specValues(body, grid)
      for (var i = 0; i < specValues.length; i++) {
        if (specValues[i].text === text) {
          return specValues[i].value
        }
      }
      // any spec found for received grid and option text
      return undefined
    },

    variationsGrids: function (body, filterGrids, delimiter) {
      // parse variations specifications to one object only
      var grids = {}
      if (body.hasOwnProperty('variations')) {
        for (var i = 0; i < body.variations.length; i++) {
          var variation = body.variations[i]
          var specifications = variation.specifications
          // abstraction to get spec text value
          var specValue = function (grid) {
            return methods.specTextValue(variation, grid, delimiter)
          }

          if (specifications) {
            // check if current variation specs match with filters
            if (filterGrids) {
              var skip = false
              for (var filter in filterGrids) {
                if (filterGrids.hasOwnProperty(filter)) {
                  if (!specifications[filter] || specValue(filter) !== filterGrids[filter]) {
                    // does not match filtered grid
                    // skip current variation
                    skip = true
                    break
                  }
                }
              }
              if (skip) {
                continue
              }
            }

            // get values from each variation spec
            for (var grid in specifications) {
              if (specifications.hasOwnProperty(grid)) {
                var text = specValue(grid)
                if (!grids.hasOwnProperty(grid)) {
                  grids[grid] = []
                } else if (grids[grid].indexOf(text) !== -1) {
                  // current spec value has already been added
                  continue
                }
                grids[grid].push(text)
              }
            }
          }
        }
      }
      // returns parsed grid object
      return grids
    }
  }

  // add methods to Ecom Vue mixin
  for (var method in methods) {
    if (methods.hasOwnProperty(method)) {
      add(method, methods[method])
    }
  }
}())
