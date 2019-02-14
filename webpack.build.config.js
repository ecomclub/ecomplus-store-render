'use strict'

const webpack = require('webpack')

// run builds for browser
const config = require('./webpack.config.js')

// Polyfill + Vue + SDK + Render
const production = Object.assign(config, {
  mode: 'production',
  output: {
    filename: 'storefront.min.js'
  }
})

// Render without dependencies
const render = { ...production }
render.output.filename = 'render.min.js'
if (!render.plugins) {
  render.plugins = []
}
// skip modules by regex
render.plugins.push(new webpack.IgnorePlugin(/(vue|ecomplus-sdk)/))

/*
const removePolyfills = config => {
  // bundle without polyfills
  const noPolyfills = { ...config }
  if (noPolyfills.module && noPolyfills.module.rules) {
    noPolyfills.module.rules.forEach(rule => {
      if (typeof rule.use === 'object' && rule.use.loader === 'babel-loader') {
        // Babel loader
        // remove useBuiltIns option to skip @babel/polyfill
        rule.use.options = {
          presets: [ '@babel/preset-env' ]
        }
      }
    })
  }
  // replace original output filename
  let name = noPolyfills.output.filename
  noPolyfills.output.filename = name.replace(/^(.*)\.min\.js$/, '$1.nopolyfills.min.js')
  return noPolyfills
}

const removeBabel = config => {
  // disable Babel transpiler
  const ems = Object.assign({}, config)
  if (ems.module) {
    let rules = ems.module.rules
    for (let i = 0; i < rules.length; i++) {
      let rule = rules[i]
      if (typeof rule.use === 'object' && rule.use.loader === 'babel-loader') {
        rules.splice(i, 1)
        break
      }
    }
  }
  // replace original output filename
  let name = ems.output.filename
  ems.output.filename = name.replace(/^(.*)\.min\.js$/, '$1.ems.min.js')
  return ems
}
*/

module.exports = production
