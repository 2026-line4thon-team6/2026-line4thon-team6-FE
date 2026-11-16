/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 로컬에서 실서버에 붙을 때만 쓴다. 백엔드 CORS가 localhost를 허용하지 않아서
  // 개발 서버가 /api 요청을 대신 보내면서 Origin · Cookie 헤더를 떼어 낸다 (.env.example 참고)
  const proxyTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET

  return {
    plugins: [react()],
    // 외부 서비스(카카오 등)에 웹 도메인으로 localhost:5173을 등록해 두었다.
    // 포트가 사용 중이면 다른 포트로 넘어가지 않고 실패하게 해서 도메인 불일치를 막는다
    server: {
      port: 5173,
      strictPort: true,
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              configure: (proxy) => {
                // localhost 에 쌓인 다른 개발용 쿠키까지 넘기면 nginx가 헤더가 너무 크다며 거절한다 (백엔드는 쿠키를 쓰지 않는다)
                proxy.on('proxyReq', (request) => {
                  request.removeHeader('origin')
                  request.removeHeader('cookie')
                })
              },
            },
          }
        : undefined,
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
      // .env.local 에 서버 주소가 있어도 테스트는 언제나 목 데이터로 돈다
      env: { VITE_API_BASE_URL: '' },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 모든 scss 파일에서 color(), gradient(), typo() 등을 import 없이 사용
          additionalData: `@use "@/styles/abstracts" as *;\n`,
        },
      },
    },
  }
})
