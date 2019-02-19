'use strict'

const webpack = require('webpack')
const config = require('./webpack.config.js')

// run builds for browser
// Polyfill + Vue + SDK + Render
const production = Object.assign(config, {
  mode: 'production',
  output: {
    filename: 'storefront.min.js'
  },
  resolve: {
    alias: {
      // production Vue
      vue: 'vue/dist/vue.min.js'
    }
  }
})

// build render standalone
const standalone = Object.assign({}, production, {
  output: {
    filename: 'render.min.js'
  },
  plugins: production.plugins.concat([
    new webpack.IgnorePlugin(/(vue|ecomplus-sdk)/)
  ])
})

module.exports = [ production, standalone ]
