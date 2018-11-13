/* global __ecom */

(function () {
  'use strict'

  // global objects
  var utils = __ecom._

  // get cookie value by cookie name
  utils.getCookie = function (cname) {
    // check for document cookies
    var cookies = root['document'].cookie

    if (typeof cookies === 'string') {
      // Ref.: https://www.w3schools.com/js/js_cookies.asp
      var name = cname + '='
      var decodedCookie = decodeURIComponent(cookies)
      var ca = decodedCookie.split(';')
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i]
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
}())
