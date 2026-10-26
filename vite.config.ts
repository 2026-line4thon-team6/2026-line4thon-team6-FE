import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 모든 scss 파일에서 color(), gradient(), typo() 등을 import 없이 사용
        additionalData: `@use "@/styles/abstracts" as *;\n`,
      },
    },
  },
})
