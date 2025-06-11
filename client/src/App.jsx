import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { routes } from '@/routes'
import { ThemeProvider } from './components/theme-provider'
import { AuthContextProvider } from './context/AuthContext'

function App() {
  return (
    <ThemeProvider>
      <AuthContextProvider>
        <Router>
          <Routes>
            {routes.map(({ path, element: Component }, idx) => (
              <Route key={idx} path={path} element={<Component/>} />
            ))}
          </Routes>
        </Router>
      </AuthContextProvider>
    </ThemeProvider>
  )
}

export default App