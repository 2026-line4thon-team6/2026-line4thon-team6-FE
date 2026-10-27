import type { Preview } from '@storybook/react-vite'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@/styles/global.scss'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        app: { name: 'App (coral-bg)', value: '#fffbfb' },
        white: { name: 'White', value: '#ffffff' },
        photo: { name: 'Photo', value: '#5b6f82' },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: 'app' },
  },
}

export default preview
