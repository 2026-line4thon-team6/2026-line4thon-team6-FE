import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import SegmentedControl from './SegmentedControl'

type SheetTab = 'content' | 'stamp'

const OPTIONS: { value: SheetTab; label: string }[] = [
  { value: 'content', label: '콘텐츠' },
  { value: 'stamp', label: '휴게소 스탬프' },
]

const meta = {
  title: 'Components/DriveMode/SegmentedControl',
  component: SegmentedControl<SheetTab>,
  tags: ['autodocs'],
  args: {
    options: OPTIONS,
    value: 'content',
    onChange: fn(),
    'aria-label': '하단 시트 탭',
  },
  argTypes: {
    value: { control: 'inline-radio', options: ['content', 'stamp'] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SegmentedControl<SheetTab>>

export default meta
type Story = StoryObj<typeof meta>

export const Content: Story = {}

export const Stamp: Story = {
  args: { value: 'stamp' },
}

// 탭을 눌러 전환
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<SheetTab>('content')
    return <SegmentedControl {...args} value={value} onChange={setValue} />
  },
}
