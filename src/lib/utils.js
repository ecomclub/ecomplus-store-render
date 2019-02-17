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

// nested search on DOM by class
const findChildsByClass = (container, className, els) => {
  // returns array of DOM elements
  if (!Array.isArray(els)) {
    els = []
  }

  if (container.childNodes) {
    for (var i = 0; i < container.childNodes.length; i++) {
      var el = container.childNodes[i]
      var classes = el.classList
      if (classes) {
        for (var ii = 0; ii < classes.length; ii++) {
          if (classes[ii] === className) {
            // match
            // el.deep = deep
            els.push(el)
            break
          }
        }
      }

      // go deeper
      // recursive function
      findChildsByClass(el, className, els)
    }
  }
  return els
}
exports.findChildsByClass = findChildsByClass
