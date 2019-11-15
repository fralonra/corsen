'use strict'

const vary = require('vary')

/**
 * CORS middleware
 *
 * @param {Object} [options]
 *  - {String|Function(req, res)} origin `access-control-allow-origin`, default is request Origin header
 *  - {String|Array} allowMethods `access-control-allow-methods`, default is 'GET,HEAD,PUT,POST,DELETE,PATCH'
 *  - {String|Array} exposeHeaders `access-control-expose-headers`
 *  - {String|Array} allowHeaders `access-control-allow-headers`
 *  - {String|Number} maxAge `access-control-max-age` in seconds
 *  - {Boolean} credentials `access-control-allow-credentials`
 * @return {Function} cors middleware
 * @api public
 */
module.exports = function (options) {
  const defaults = {
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  }

  options = Object.assign({}, defaults, options)

  if (Array.isArray(options.exposeHeaders)) {
    options.exposeHeaders = options.exposeHeaders.join(',')
  }

  if (Array.isArray(options.allowMethods)) {
    options.allowMethods = options.allowMethods.join(',')
  }

  if (Array.isArray(options.allowHeaders)) {
    options.allowHeaders = options.allowHeaders.join(',')
  }

  if (options.maxAge) {
    options.maxAge = String(options.maxAge)
  }

  options.credentials = !!options.credentials

  return async function cors (req, res) {
    // If the Origin header is not present terminate this set of steps.
    // The request is outside the scope of this specification.
    const requestOrigin = req.headers.origin
    // Always set Vary header
    // https://github.com/rs/cors/issues/10
    if (!res.headersSent) {
      vary(res, 'Origin')
    }

    if (!requestOrigin) return

    let origin
    if (typeof options.origin === 'function') {
      origin = options.origin(req, res)
      if (origin instanceof Promise) origin = await origin
      if (!origin) return
    } else {
      origin = options.origin || requestOrigin
    }

    if (req.method !== 'OPTIONS') {
      // Simple Cross-Origin Request, Actual Request, and Redirects
      res.setHeader('access-control-allow-origin', origin)

      if (options.credentials === true) {
        res.setHeader('access-control-allow-credentials', 'true')
      }

      if (options.exposeHeaders) {
        res.setHeader('access-control-expose-headers', options.exposeHeaders)
      }
    } else {
      // Preflight Request

      // If there is no access-control-request-method header or if parsing failed,
      // do not set any additional headers and terminate this set of steps.
      // The request is outside the scope of this specification.
      if (!req.headers['access-control-request-method']) {
        // this not preflight request, ignore it
        return
      }

      res.setHeader('access-control-allow-origin', origin)

      if (options.credentials === true) {
        res.setHeader('access-control-allow-credentials', 'true')
      }

      if (options.maxAge) {
        res.setHeader('access-control-max-age', options.maxAge)
      }

      if (options.allowMethods) {
        res.setHeader('access-control-allow-methods', options.allowMethods)
      }

      let allowHeaders = options.allowHeaders
      if (!allowHeaders) {
        allowHeaders = req.headers['access-control-request-headers']
      }
      if (allowHeaders) {
        res.setHeader('access-control-allow-headers', allowHeaders)
      }

      res.statusCode = 204
    }
  }
}
