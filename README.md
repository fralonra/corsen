corsen
=======

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/corsen.svg?style=flat-square
[npm-url]: https://npmjs.org/package/corsen
[travis-image]: https://img.shields.io/travis/fralonra/corsen.svg?style=flat-square
[travis-url]: https://travis-ci.com/fralonra/corsen
[download-image]: https://img.shields.io/npm/dm/corsen.svg?style=flat-square
[download-url]: https://npmjs.org/package/corsen

A universal [Cross-Origin Resource Sharing(CORS)](https://developer.mozilla.org/en/docs/Web/HTTP/Access_control_CORS) middleware. Derrived from [@koa/cors](https://github.com/koajs/cors).

## Installation

```bash
npm install corsen
```

or
```bash
yarn add corsen
```

## Quick start

Enable cors with default options:

- origin: request Origin header
- allowMethods: GET,HEAD,PUT,POST,DELETE,PATCH

```js
const http = require('http')
const cors = require('corsen')({
  // place your options here
})

const server = http.createServer((req, res) => {
  cors(req, res)
  // if you pass a function to options.origin and that function returns a Promise, you can use async/await: await cors(req, res)
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('ok')
})
```

## cors(options)

```js
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
```

## Credit

All the commit before [71c4d00](https://github.com/fralonra/corsen/commit/71c4d00b170f52fd1324e9fd028816408867f8a6) are credited to koajs contributors.

## Difference between corsen and @koa/cors

- The middleware function returned by `corsen` has a signature of `function(http.IncomingMessage, http.ServerResponse)`, while `@koa/cors` recieves a koa's `Context` object.
- All the header names set in `corsen` are lowercase.
- `corsen` has removed the error handling utility of `@koa/cors`. There is not `keepHeadersOnError` porperty in options.

## Examples

[felid-cors](https://github.com/felidjs/felid-cors) A [Felid](https://github.com/felidjs/felid) plugin for CORS.

## License

[MIT](./LICENSE)
