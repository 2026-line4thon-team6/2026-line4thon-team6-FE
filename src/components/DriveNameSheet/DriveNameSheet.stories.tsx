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

export const Create: Story = {}

export const Edit: Story = {
  args: { mode: 'edit', defaultName: '우리의 첫 바다 드라이브' },
}

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
