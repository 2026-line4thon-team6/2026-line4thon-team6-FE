import { mockGetAppConfig } from '@/mocks/djPlaylists'
import type { ApiResponse } from '@/types/api'
import type { AppConfig } from '@/types/appConfig'
import { apiFetch, USE_MOCK } from './client'

export function getAppConfig(): Promise<ApiResponse<AppConfig>> {
  if (USE_MOCK) return mockGetAppConfig()

  return apiFetch<AppConfig>('/app-config')
}
