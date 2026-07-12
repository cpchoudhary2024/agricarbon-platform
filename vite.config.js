import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Mount the /api handlers on the Vite dev server.
 *
 * In production these run as Vercel serverless functions. Locally, Vite knows nothing about them,
 * which normally forces you to either run `vercel dev` or maintain a second mock server that drifts
 * out of sync with the real one. Instead we import the very same handler modules and adapt Node's
 * req/res to the minimal shape they expect. One implementation, exercised identically in both
 * environments.
 */
function apiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const url = new URL(req.url, 'http://localhost');
        const route = url.pathname.replace('/api/', '');

        try {
          // Import fresh each request so edits to the handlers hot-reload without a server restart.
          const mod = await server.ssrLoadModule(`/api/${route}.js`);
          req.query = Object.fromEntries(url.searchParams);
          await mod.default(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message, stack: err.stack }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiPlugin()],
  build: {
    // The county geometry and saturation data are deliberately large and deliberately
    // code-split (see SaturationMap.jsx) — they load only when someone reaches the map,
    // and never touch the main bundle. The default 500 kB warning is not telling us
    // anything we have not already handled.
    chunkSizeWarningLimit: 600,
  },
});
