import http from 'node:http';
import mongoose from 'mongoose';

process.env.SKIP_DB = '1';
process.env.NODE_ENV = 'test';
mongoose.set('bufferCommands', false);

const { app } = await import('../../server.js');

export function withServer(fn) {
  return async (t) => {
    const server = http.createServer(app);
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    t.after(async () => {
      await new Promise((r) => server.close(r));
    });
    const addr = server.address();
    const req = (path, options = {}) => new Promise((resolve, reject) => {
      const r = http.request({ hostname: '127.0.0.1', port: addr.port, path, method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(options.headers||{}) } }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { let json=null; try{json=body?JSON.parse(body):null}catch{} resolve({ status: res.statusCode, json, body, headers: res.headers }); });
      });
      r.on('error', reject);
      if (options.body) r.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      r.end();
    });
    await fn(t, req);
  };
}
