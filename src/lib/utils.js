'use strict'

// get document object
const { document } = require('./dom')

// get cookie value by cookie name
exports.getCookie = cname => {
  // check for document cookies
  const cookies = document.cookie

  if (typeof cookies === 'string') {
    // Ref.: https://www.w3schools.com/js/js_cookies.asp
    let name = cname + '='
    let decodedCookie = decodeURIComponent(cookies)
    let ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') {
        c = c.substring(1)
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length)
      }
    }
  }

  // cookie not found
  // returns null by default
  return null
}
