'use strict'

// auxiliary methods for Vue instances
const methods = {}

/*
 * Add custom method to Vue instances.
 * @param {string} name - Name of custom method
 * @param {function} func - The method itself (function)
 */

const addVueMethod = (name, func) => {
  methods[name] = (function () {
    // scoped
    return function () {
      // convert arguments array-like object to array
      let args = []
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i])
      }
      if (!args[0] && this.$data) {
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

/**
 * Ecom auxiliary methods for Vue instances.
 * @namespace Ecom.methods
 */

module.exports = methods

// autoload default methods
;[
  'name',
  'width',
  'height',
  'price',
  'minQuantity',
  'inStock',
  'formatMoney',
  'onPromotion',
  'alphabeticalSort',
  'findByProperty',
  'findBySlug',
  'filterByParentSlug',
  'splitCategoryTree',
  'specValues',
  'specTextValue',
  'specValueByText',
  'variationsGrids'
].forEach(name => {
  addVueMethod(name, require('./def/' + name + '.js'))
})

// handle custom methods from window object on browser
methods.fn = function (method, args) {
  if (typeof window === 'object') {
    // try to call global function
    let fn = window[method]
    if (typeof fn === 'function') {
      return fn({
        // pass body object from instance data
        body: (this.$data && this.$data.body) || {},
        // bypass received args
        args
      })
    } else {
      // debug
      console.log('WARN: window.' + method + ' isn\'t a function', this.$el)
    }
  }
  // returns null by default
  return null
}
