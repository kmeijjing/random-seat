import { createTheme, MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles.css'

const theme = createTheme({
  primaryColor: 'orange',
  defaultRadius: 'lg',
  fontFamily: "'SUIT Variable', 'Pretendard Variable', 'Apple SD Gothic Neo', sans-serif",
  headings: {
    fontFamily: "'SUIT Variable', 'Pretendard Variable', 'Apple SD Gothic Neo', sans-serif",
    fontWeight: '700',
  },
  components: {
    Card: { defaultProps: { radius: 'xl' } },
    Button: { defaultProps: { radius: 'xl' } },
    Badge: { defaultProps: { radius: 'xl' } },
    NumberInput: { defaultProps: { radius: 'lg' } },
    Textarea: { defaultProps: { radius: 'lg' } },
    Select: { defaultProps: { radius: 'lg' } },
    Checkbox: { defaultProps: { radius: 'md' } },
    Accordion: { defaultProps: { radius: 'lg' } },
    Drawer: { defaultProps: { radius: 'lg' } },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </MantineProvider>
  </React.StrictMode>,
)
