'use strict';

const assert = require('assert');
const inject = require('injectar');
const corsen = require('../');

const body = { foo: 'bar' };
function buildDispatch(cors) {
  return async function(req, res) {
    await cors(req, res);
    res.setHeader('content-type', 'application/json charset=utf-8');
    res.end(JSON.stringify(body));
  };
}

describe('cors.test.js', function() {
  describe('default options', function() {
    const dispatch = buildDispatch(corsen());

    it('should not set `access-control-allow-origin` when request `origin` header missing', function(done) {
      inject(dispatch)
        .get('/')
        .end((err, res) => {
          assert(!err);
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert(!res.headers['access-control-allow-origin']);
          done();
        });
    });

    it('should set `access-control-allow-origin` to request origin header', function(done) {
      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-allow-origin'], 'http://koajs.com');
          done();
        });
    });

    it('should 204 on Preflight Request', function(done) {
      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-allow-origin'], 'http://koajs.com');
          assert.strictEqual(res.headers['access-control-allow-methods'], 'GET,HEAD,PUT,POST,DELETE,PATCH');
          done();
        });
    });

    it('should not Preflight Request if request missing access-control-request-method', function(done) {
      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          done();
        });
    });

    it('should always set `vary` to Origin', function(done) {
      inject(dispatch)
        .get('/')
        .header('origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers.vary, 'Origin');
          done();
        });
    });
  });

  describe('options.origin=*', function() {
    const dispatch = buildDispatch(corsen({
      origin: '*',
    }));

    it('should always set `access-control-allow-origin` to *', function(done) {
      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-allow-origin'], '*');
          done();
        });
    });
  });

  describe('options.origin=function', function() {
    const dispatch = buildDispatch(corsen({
      origin(ctx) {
        if (ctx.url === '/forbin') {
          return false;
        }
        return '*';
      },
    }));

    it('should disable cors', function(done) {
      inject(dispatch)
        .get('/forbin')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert(!err);
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert(!res.headers['access-control-allow-origin']);
          done();
        });
    });

    it('should set `access-control-allow-origin` to *', function(done) {
      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-allow-origin'], '*');
          done();
        });
    });
  });

  describe('options.origin=async function', function() {
    const dispatch = buildDispatch(corsen({
      async origin(req) {
        if (req.url === '/forbin') {
          return false;
        }
        return '*';
      },
    }));

    it('should disable cors', function(done) {
      inject(dispatch)
        .get('/forbin')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert(!res.headers['access-control-allow-origin']);
          done();
        });
    });

    it('should set `access-control-allow-origin` to *', function(done) {
      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-allow-origin'], '*');
          done();
        });
    });
  });

  describe('options.exposeHeaders', function() {
    it('should `access-control-expose-headers`: `content-length`', function(done) {
      const dispatch = buildDispatch(corsen({
        exposeHeaders: 'content-length',
      }));

      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-expose-headers'], 'content-length');
          done();
        });
    });

    it('should work with array', function(done) {
      const dispatch = buildDispatch(corsen({
        exposeHeaders: [ 'content-length', 'x-header' ],
      }));

      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-expose-headers'], 'content-length,x-header');
          done();
        });
    });
  });

  describe('options.maxAge', function() {
    it('should set `maxAge` with number', function(done) {
      const dispatch = buildDispatch(corsen({
        maxAge: 3600,
      }));

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-max-age'], '3600');
          done();
        });
    });

    it('should set `maxAge` with string', function(done) {
      const dispatch = buildDispatch(corsen({
        maxAge: '3600',
      }));

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-max-age'], '3600');
          done();
        });
    });

    it('should not set `maxAge` on simple request', function(done) {
      const dispatch = buildDispatch(corsen({
        maxAge: '3600',
      }));

      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert(!err);
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert(!res.headers['access-control-max-age']);
          done();
        });
    });
  });

  describe('options.credentials', function() {
    const dispatch = buildDispatch(corsen({
      credentials: true,
    }));

    it('should enable `access-control-allow-credentials` on Simple request', function(done) {
      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
          done();
        });
    });

    it('should enable `access-control-allow-credentials` on Preflight request', function(done) {
      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'DELETE')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-allow-credentials'], 'true');
          done();
        });
    });
  });

  describe('options.allowHeaders', function() {
    it('should work with allowHeaders is string', function(done) {
      const dispatch = buildDispatch(corsen({
        allowHeaders: 'X-PINGOTHER',
      }));

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-allow-headers'], 'X-PINGOTHER');
          done();
        });
    });

    it('should work with allowHeaders is array', function(done) {
      const dispatch = buildDispatch(corsen({
        allowHeaders: [ 'X-PINGOTHER' ],
      }));

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-allow-headers'], 'X-PINGOTHER');
          done();
        });
    });

    it('should set `access-control-allow-headers` to request `access-control-request-headers` header', function(done) {
      const dispatch = buildDispatch(corsen());

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .header('access-control-request-headers', 'X-PINGOTHER')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-allow-headers'], 'X-PINGOTHER');
          done();
        });
    });
  });

  describe('options.allowMethods', function() {
    it('should work with allowMethods is array', function(done) {
      const dispatch = buildDispatch(corsen({
        allowMethods: [ 'GET', 'POST' ],
      }));

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          assert.strictEqual(res.headers['access-control-allow-methods'], 'GET,POST');
          done();
        });
    });

    it('should skip allowMethods', function(done) {
      const dispatch = buildDispatch(corsen({
        allowMethods: null,
      }));

      inject(dispatch)
        .options('/')
        .header('Origin', 'http://koajs.com')
        .header('access-control-request-method', 'PUT')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 204);
          done();
        });
    });
  });

  describe('other middleware has been set `vary` header to Accept-Encoding', function() {
    const cors = corsen();
    const dispatch = async function(req, res) {
      res.setHeader('vary', 'Accept-Encoding');
      await cors(req, res);
      res.setHeader('content-type', 'application/json charset=utf-8');
      res.end(JSON.stringify(body));
    };

    it('should append `vary` header to Origin', function(done) {
      inject(dispatch)
        .get('/')
        .header('Origin', 'http://koajs.com')
        .end((err, res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.deepStrictEqual(res.json(), body);
          assert.strictEqual(res.headers.vary, 'Accept-Encoding, Origin');
          done();
        });
    });
  });
});
