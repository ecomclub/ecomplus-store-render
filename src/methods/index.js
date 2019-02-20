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
  'variationsGrids',
  'toggle',
  'includes'
].forEach(name => {
  addVueMethod(name, require('./def/' + name + '.js'))
})

// additional methods for browser only
if (typeof window === 'object') {
  // handle custom methods from window object
  methods.run = require('./handlers/run')
  // handle args update for keep alive Vue instances
  methods.set = require('./handlers/set')
}
