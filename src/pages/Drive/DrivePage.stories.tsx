import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { Drive } from '@/types/drive'
import DrivePage from './DrivePage'

const PREPARING: Drive = {
  id: 'drv_01',
  coupleId: 'cpl_01',
  title: '우리의 첫 바다 드라이브',
  status: 'PREPARING',
  driverUserId: 'usr_me',
  passengerUserId: 'usr_partner',
  recorderUserId: 'usr_me',
  origin: null,
  destination: null,
  routeId: null,
  startedAt: null,
  pausedAt: null,
  endedAt: null,
  endReason: null,
  controlVersion: 1,
  metrics: {
    distanceMeters: 0,
    activeDurationSeconds: 0,
    pausedDurationSeconds: 0,
    estimatedArrivalAt: null,
    lastGpsAt: null,
    gpsQuality: 'MISSING',
  },
  canCreateCard: false,
  cardId: null,
  editableUntil: null,
  playlistId: null,
}

const meta = {
  title: 'Pages/Drive',
  component: DrivePage,
  parameters: { layout: 'fullscreen' },
  args: {
    status: 'ready',
    drive: PREPARING,
    onRename: async () => true,
    onRouteSearch: fn(),
    onLocate: fn(),
  },
  // 드라이브명 수정이 실제로 반영되도록 상태로 관리
  render: function Render(args) {
    const [drive, setDrive] = useState(args.drive)
    return (
      <DrivePage
        {...args}
        drive={drive}
        onRename={async (title) => {
          setDrive((prev) => (prev ? { ...prev, title } : prev))
          return true
        }}
      />
    )
  },
} satisfies Meta<typeof DrivePage>

export default meta
type Story = StoryObj<typeof meta>

// 목적지 설정 전
export const FirstEntry: Story = {}

export const Driving: Story = {
  args: {
    drive: {
      ...PREPARING,
      status: 'ACTIVE',
      metrics: {
        ...PREPARING.metrics,
        distanceMeters: 24600,
        activeDurationSeconds: 1938,
        estimatedArrivalAt: '2026-11-15T10:47:00Z',
      },
    },
  },
}

export const LoadError: Story = {
  args: { status: 'error', drive: null },
}
