import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  server: {
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          const apiPath = resolve(__dirname, req.url.split('?')[0] + '.js');
          if (fs.existsSync(apiPath)) {
            try {
              // Mock Vercel Request/Response for local Vite
              const handler = (await import(apiPath + `?t=${Date.now()}`)).default;
              
              const chunks = [];
              req.on('data', chunk => chunks.push(chunk));
              req.on('end', async () => {
                const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
                
                const vercelRes = {
                  status: (code) => { res.statusCode = code; return vercelRes; },
                  json: (data) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return vercelRes;
                  },
                  send: (data) => { res.end(data); return vercelRes; },
                  end: () => { res.end(); return vercelRes; }
                };

                const vercelReq = {
                  method: req.method,
                  body: body,
                  query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
                };

                await handler(vercelReq, vercelRes);
              });
              return;
            } catch (e) {
              console.error('API Error:', e);
            }
          }
        }
        next();
      });
    }
  }
});
