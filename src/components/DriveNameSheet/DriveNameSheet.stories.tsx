import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import Button from '@/components/Button/Button'
import DriveNameSheet from './DriveNameSheet'

const meta = {
  title: 'Components/DriveMode/DriveNameSheet',
  component: DriveNameSheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    mode: 'create',
    mascotName: '붕붕이',
    onSubmit: fn(),
    onClose: fn(),
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['create', 'edit'] },
  },
} satisfies Meta<typeof DriveNameSheet>

export default meta
type Story = StoryObj<typeof meta>

// 홈 '드라이브 시작하기' → 드라이브명 입력 (입력 없이 출발 가능)
export const Create: Story = {}

// 드라이브 모드 상단 드라이브명 탭 → 수정 (빈 값이면 수정 완료 비활성)
export const Edit: Story = {
  args: { mode: 'edit', defaultName: '우리의 첫 바다 드라이브' },
}

// 버튼으로 열고 닫기
export const Interactive: Story = {
  args: { open: false },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    return (
      <div style={{ padding: 24 }}>
        <p style={{ marginBottom: 12 }}>드라이브명: {name || '(없음)'}</p>
        <Button size="lg" icon="car" onClick={() => setOpen(true)}>
          드라이브 시작하기
        </Button>
        <DriveNameSheet
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={(next) => {
            setName(next)
            setOpen(false)
          }}
        />
      </div>
    )
  },
}
