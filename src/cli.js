'use strict'

if (typeof process === 'object' && Array.isArray(process.argv)) {
  // NodeJS cli
  // node index.js input.html output.html
  if (process.argv.length >= 4) {
    // setup DOM
    require('./lib/dom')(process.argv[3])
    // render entire document
    // require('./init')()
  }
}
