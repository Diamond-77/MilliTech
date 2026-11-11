import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// "preview" mode builds with relative paths (for a self-contained preview folder).
// The normal build is served from /demo/leikoi-kromatics/ on millitech.vercel.app.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'preview' ? './' : '/demo/leikoi-kromatics/',
  build: {
    outDir: mode === 'preview' ? 'dist-preview' : 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
  },
}))
