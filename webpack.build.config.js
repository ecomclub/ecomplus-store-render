'use strict'

// run builds for browser
const config = require('./webpack.config.js')

// Polyfill + Vue + SDK + Render
const production = Object.assign(config, {
  mode: 'production',
  output: {
    filename: 'storefront.min.js'
  }
})

module.exports = production
