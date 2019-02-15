'use strict'

const config = require('./webpack.config.js')

// run builds for browser
// Polyfill + Vue + SDK + Render
const production = Object.assign(config, {
  mode: 'production',
  output: {
    filename: 'storefront.min.js'
  }
})

module.exports = production
