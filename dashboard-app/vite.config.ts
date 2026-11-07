import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// Inlines the built JS and CSS into one templates/dashboard.html, the page dashboard.mjs serves.
const singleFile = (): Plugin => ({
  name: 'single-file',
  enforce: 'post',
  generateBundle(_, bundle) {
    const page = bundle['index.html']
    if (page.type !== 'asset') return
    let html = String(page.source)
    for (const [name, file] of Object.entries(bundle)) {
      if (name === 'index.html') continue
      const tag = new RegExp(`<(script|link)[^>]*${name.replace(/[.\\/]/g, '\\$&')}"[^>]*>(</script>)?`)
      const body = file.type === 'chunk' ? file.code : String(file.source)
      html = html.replace(tag, () => file.type === 'chunk'
        ? `<script type="module">${body.replace(/<\/script/gi, '<\\/script')}</script>`
        : `<style>${body}</style>`)
      delete bundle[name]
    }
    page.source = html
    page.fileName = 'dashboard.html'
  },
})

// `npm run dev` proxies /api to a running dashboard.
export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), singleFile()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: { outDir: '../templates', emptyOutDir: false, assetsInlineLimit: 1e8, cssCodeSplit: false, chunkSizeWarningLimit: 1500 },
  server: { proxy: { '/api': 'http://localhost:4747' } },
})
