import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const base = env.VITE_BASE ?? '/';
  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: `http://localhost:${env.MAIL_SERVER_PORT ?? '3001'}`,
          changeOrigin: true,
        },
        '/uploads': {
          target: `http://localhost:${env.MAIL_SERVER_PORT ?? '3001'}`,
          changeOrigin: true,
        },
      },
    },
  };
});
