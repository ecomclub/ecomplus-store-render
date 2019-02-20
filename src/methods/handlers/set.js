'use strict'

const toggle = require('./../def/toggle')

/**
 * Update args with reactivity on keep alive Vue instances.
 * @memberOf Ecom.methods
 * @param {array|string} props - Ordered list of properties to go deep on args object
 * @param {mixed} value - Value to set on last level object property
 * @param {boolean} [isArray=true] - Whether the last object should be treated as array if possible
 */

const set = function (props, value, isArray = true) {
  // start with args property from instance data
  let obj = this.args
  if (!Array.isArray(props)) {
    // parse string or number to array
    props = [ props ]
  }

  // go until last object level
  let lastIndex = props.length - 1
  for (let i = 0; obj && typeof obj === 'object' && i < lastIndex; i++) {
    let prop = props[i]
    if (obj[prop] === undefined) {
      // create new object
      obj[prop] = {}
      console.log(prop)
    }
    obj = obj[prop]
  }

  // last level
  let prop = props[lastIndex]
  if (typeof obj === 'object' && obj !== null) {
    if (isArray && typeof value === 'string') {
      // add or remove element from array
      obj[prop] = toggle(obj[prop], value)
    } else {
      // just set the property
      obj[prop] = value
    }
  } else {
    // debug
    console.log('WARN: trying to \'set\' on non-object', this.$el, prop)
  }

  // mark up to date with timestamp
  if (this.args) {
    this.args.updated = Date.now()
  }
}

module.exports = set
