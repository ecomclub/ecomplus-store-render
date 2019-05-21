'use strict'

const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: './src/index.browser.js',
  output: {
    library: 'StorefrontRenderer',
    libraryTarget: 'umd',
    path: path.join(__dirname, 'dist'),
    filename: 'storefront.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'tests'),
    compress: true,
    port: 9000
  },
  module: {
    rules: [{
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader'
      }
    }]
  },
  plugins: [
    new webpack.IgnorePlugin(/(jsdom|vue-server-renderer|\.\/cli|\.\/ssr)/)
  ],
  resolve: {
    alias: {
      vue: 'vue/dist/vue.js'
    }
  },
  stats: {
    colors: true
  },
  devtool: 'source-map'
}
