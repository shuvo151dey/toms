import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // sockjs-client (used by WebSocketService for STOMP) references Node's
  // `global`, which CRA's webpack config polyfilled automatically but Vite
  // does not — without this the app throws "global is not defined" on load.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
