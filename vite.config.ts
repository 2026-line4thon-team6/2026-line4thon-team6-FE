/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

// 배포마다 바뀌는 빌드 id. Vercel이면 커밋 SHA, 아니면 빌드 시각
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)

// dist/version.json 에 빌드 id를 써 둔다. 켜져 있는 앱이 이 파일을 다시 받아 새 배포인지 확인한다 (useAppUpdate)
function versionFile(): Plugin {
  return {
    name: 'bbus-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId: BUILD_ID }) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 로컬에서 실서버에 붙을 때만 쓴다. 백엔드 CORS가 localhost를 허용하지 않아서
  // 개발 서버가 /api 요청을 대신 보내면서 Origin · Cookie 헤더를 떼어 낸다 (.env.example 참고)
  const proxyTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET

  return {
    plugins: [react(), versionFile()],
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
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
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              // 모든 화면이 쓰는 React · 라우터는 따로 묶는다. 앱 코드만 바뀐 배포에서는 이 파일을 브라우저 캐시에서 그대로 쓴다
              { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/ },
            ],
          },
        },
      },
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
