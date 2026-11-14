/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 외부 서비스(카카오 등)에 웹 도메인으로 localhost:5173을 등록해 두었다.
  // 포트가 사용 중이면 다른 포트로 넘어가지 않고 실패하게 해서 도메인 불일치를 막는다
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
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
