import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://dev-api.dataudipi.com',
        changeOrigin: true
      },
      '/static/images': {
        target: 'http://dev-api.dataudipi.com',
        changeOrigin: true,
        secure: false
      },
      '/static/assets': {
        target: 'http://dev-api.dataudipi.com',
        changeOrigin: true
      },
      '/docs': {
        target: 'http://dev-api.dataudipi.com',
        changeOrigin: true
      },
      '/openapi.json': {
        target: 'http://dev-api.dataudipi.com',
        changeOrigin: true
      }
    }
  }
})
