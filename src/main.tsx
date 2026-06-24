import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from '@ve-o-design/web-react'
import '@arco-design/web-react/dist/css/arco.css'
import '@ve-o-design/web-react/es/style/index.css'

import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
