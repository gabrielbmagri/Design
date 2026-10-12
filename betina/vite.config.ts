import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

// `vite build --mode demo` gera uma versão de demonstração sem Firebase
// (dados de exemplo guardados no navegador).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'demo' ? './' : '/',
  resolve: {
    alias:
      mode === 'demo'
        ? {
            'firebase/app': r('./src/demo/app.ts'),
            'firebase/auth': r('./src/demo/auth.ts'),
            'firebase/firestore': r('./src/demo/firestore.ts'),
          }
        : {},
  },
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
}))
