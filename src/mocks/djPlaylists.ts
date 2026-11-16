import type { ApiResponse } from '@/types/api'
import type { AppConfig } from '@/types/appConfig'
import type { Job } from '@/types/job'
import type { CreatePlaylistRequest, Playlist, PlaylistTrack } from '@/types/playlist'
import { mockStartJob } from './jobs'
import { createMeta, mockApiError } from './utils'

export const MOCK_APP_CONFIG: AppConfig = {
  moods: ['EXCITING', 'EMOTIONAL', 'CALM', 'TRAVEL', 'FLUTTER', 'SUNSET', 'CITY_NIGHT', 'ROMANTIC'],
  weatherOptions: ['SUNNY', 'CLOUDY', 'RAIN', 'SNOW', 'WINDY'],
  genres: ['BALLAD', 'K_POP', 'INDIE', 'HIP_HOP', 'CITY_POP', 'JAZZ', 'RNB', 'POP', 'ACOUSTIC', 'DANCE', 'OST', 'ROCK'],
  limits: { moodMaxCount: 2, genreMaxCount: 3 },
}

const SONGS: [string, string, number][] = [
  ['너의 모든 순간', '성시경', 280],
  ['Love wins all', '아이유', 272],
  ['사랑은 늘 도망가', '임영웅', 272],
  ['첫 눈', 'EXO', 272],
  ['눈사람', '정승환', 272],
  ['괜찮아도 괜찮아', '도경수', 248],
  ['To. X', '태연', 272],
  ['밤편지', '아이유', 253],
  ['봄날', '방탄소년단', 274],
  ['사건의 지평선', '윤하', 300],
  ['Hype Boy', 'NewJeans', 179],
  ['주저하는 연인들을 위해', '잔나비', 315],
  ['너를 만나', '폴킴', 312],
]

const playlists = new Map<string, Playlist>()
let count = 0

export function resetMockDjPlaylists() {
  playlists.clear()
  count = 0
}

export async function mockGetAppConfig(): Promise<ApiResponse<AppConfig>> {
  return { data: structuredClone(MOCK_APP_CONFIG), meta: createMeta() }
}

export async function mockCreatePlaylist(request: CreatePlaylistRequest): Promise<ApiResponse<Job>> {
  if (request.moods.length < 1 || request.moods.length > 2 || !request.weather || request.genres.length > 3) {
    throw mockApiError(422, 'VALIDATION_FAILED', '추천 조건을 확인해 주세요.')
  }
  const job = mockStartJob('PLAYLIST_GENERATION', 'PLAYLIST', () => {
    const playlistId = `ply_mock_${++count}`
    playlists.set(playlistId, buildPlaylist(playlistId, request))
    return playlistId
  })
  return { data: job, meta: createMeta() }
}

function buildPlaylist(id: string, request: CreatePlaylistRequest): Playlist {
  const tracks: PlaylistTrack[] = SONGS.map(([title, artist, durationSeconds], index) => ({
    id: `trk_${id}_${index + 1}`,
    providerTrackId: `spotify_${index + 1}`,
    title,
    artist,
    durationSeconds,
    albumImageUrl: null,
    providerUri: null,
    externalUrl: `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`,
    order: index + 1,
  }))
  return {
    id,
    title: '노을처럼 따뜻한 우리',
    moods: request.moods,
    weather: request.weather,
    genres: request.genres,
    targetDurationSeconds: 3600,
    tracks,
    trackCount: tracks.length,
    durationSeconds: tracks.reduce((sum, track) => sum + track.durationSeconds, 0),
    savedByMe: false,
    createdAt: new Date().toISOString(),
    version: 1,
  }
}

function getOrThrow(playlistId: string) {
  const playlist = playlists.get(playlistId)
  if (!playlist) throw mockApiError(404, 'RESOURCE_NOT_FOUND', '플레이리스트를 찾을 수 없어요.')
  return playlist
}

export async function mockGetPlaylist(playlistId: string): Promise<ApiResponse<Playlist>> {
  return { data: structuredClone(getOrThrow(playlistId)), meta: createMeta() }
}

export async function mockEditPlaylistTracks(
  playlistId: string,
  { trackIds, expectedVersion }: { trackIds: string[]; expectedVersion: number },
): Promise<ApiResponse<Playlist>> {
  const playlist = getOrThrow(playlistId)
  if (playlist.version !== expectedVersion) {
    throw mockApiError(409, 'VERSION_CONFLICT', '최신 플레이리스트를 조회해 주세요.')
  }
  const byId = new Map(playlist.tracks.map((track) => [track.id, track]))
  if (trackIds.length === 0 || new Set(trackIds).size !== trackIds.length || trackIds.some((id) => !byId.has(id))) {
    throw mockApiError(422, 'INVALID_TRACK_SET', '기존 곡을 중복 없이 선택해 주세요.')
  }
  const tracks = trackIds.map((id, index) => ({ ...byId.get(id)!, order: index + 1 }))
  const next: Playlist = {
    ...playlist,
    tracks,
    trackCount: tracks.length,
    durationSeconds: tracks.reduce((sum, track) => sum + track.durationSeconds, 0),
    version: playlist.version + 1,
  }
  playlists.set(playlistId, next)
  return { data: structuredClone(next), meta: createMeta() }
}

export async function mockSetPlaylistSaved(playlistId: string, saved: boolean): Promise<void> {
  playlists.set(playlistId, { ...getOrThrow(playlistId), savedByMe: saved })
}
