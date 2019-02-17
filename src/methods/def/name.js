'use strict'

/**
 * Returns object name by lang.
 * @memberOf Ecom.methods
 * @param {object} body - Object (product, category...) body
 * @param {string} [lang] - Language by code such as 'pt_br'
 * @returns {string}
 */

const name = (body, lang) => {
  if (!lang && typeof this === 'object' && this !== null && this.Store) {
    // this is the Vue instance
    // default store lang
    lang = this.Store.lang
  }
  // prefer translated item name
  if (lang && body.hasOwnProperty('i18n') && body.i18n.hasOwnProperty(lang)) {
    return body.i18n[lang]
  } else {
    return body.name || ''
  }
}

module.exports = name
