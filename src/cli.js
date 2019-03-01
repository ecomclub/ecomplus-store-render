#!/usr/bin/env node

'use strict'

if (typeof process === 'object' && Array.isArray(process.argv)) {
  // NodeJS CLI
  // node ./index.js https://www.mystore.com.br/product
  if (process.argv.length >= 3) {
    // core Node.js path module
    const path = require('path')
    // setup DOM first
    let url = process.argv[2]

    require(path.join(__dirname, 'lib', 'dom'))(null, url)
      .then(dom => {
        // render entire document
        require(path.join(__dirname, 'ecom')).init().then(() => {
          console.log(dom.serialize())
          process.exit(0)
        })
      })
      .catch(err => {
        // jsdom error
        throw err
      })
  }
}
