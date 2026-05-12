import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vite-plugin-vue-devtools is dev-only by design and does nothing in production builds
    ...(process.env.NODE_ENV !== 'production' ? [vueDevTools()] : []),
  ],
  base: '/logic/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})