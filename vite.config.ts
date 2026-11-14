import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), {
    name: 'firepulse-local-data-api',
    apply: 'serve',
    async configureServer(server) {
      // Explicit test/remote proxy overrides retain their existing semantics.
      if (server.config.server.proxy?.['/api']) return
      // Import the existing Node API at runtime, never into a client bundle.
      // One dev process prevents a stale standalone :3001 from shadowing archives.
      const moduleURL = new URL('./server/app.js', import.meta.url).href
      const { createApp } = await import(moduleURL)
      const app = createApp({ remoteOrigin: () => undefined })
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0].startsWith('/api/')) app(req, res, next)
        else next()
      })
    },
  }],
  // Keep user development optimization separate from regression-test servers.
  cacheDir: 'node_modules/.vite-firepulse-dev',
  server: { port: 5173, strictPort: true },
})
