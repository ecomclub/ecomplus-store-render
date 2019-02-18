'use strict'

if (typeof process === 'object' && Array.isArray(process.argv)) {
  // NodeJS CLI
  // node ./index.js https://www.mystore.com.br/product
  if (process.argv.length >= 3) {
    // setup DOM first
    let url = process.argv[2]

    require('./lib/dom')(null, url)
      .then(dom => {
        // render entire document
        require('./ecom').init().then(() => {
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
