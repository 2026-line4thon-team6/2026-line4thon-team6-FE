import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { mockFetchLegalDocument } from '@/mocks/legal'
import LegalDocumentPage from './LegalDocumentPage'

const { data: PRIVACY } = await mockFetchLegalDocument('PRIVACY')
const { data: TERMS } = await mockFetchLegalDocument('TERMS')
const { data: OPEN_SOURCE } = await mockFetchLegalDocument('OPEN_SOURCE')

const meta = {
  title: 'Pages/LegalDocument',
  component: LegalDocumentPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    type: 'PRIVACY',
    status: 'ready',
    document: PRIVACY,
    onBack: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof LegalDocumentPage>

export default meta
type Story = StoryObj<typeof meta>

// Figma: 개인정보 처리방침
export const Privacy: Story = {}

// Figma: 이용 약관
export const Terms: Story = {
  args: { type: 'TERMS', document: TERMS },
}

// Figma: 오픈소스
export const OpenSource: Story = {
  args: { type: 'OPEN_SOURCE', document: OPEN_SOURCE },
}

export const Loading: Story = {
  args: { status: 'loading', document: null },
}

export const LoadError: Story = {
  args: { status: 'error', document: null },
}
