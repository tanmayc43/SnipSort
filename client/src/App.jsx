import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { routes } from '@/routes'
import {Navbar} from '@/components/Navbar'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {routes.map(({ path, element: Component }, idx) => (
          <Route key={idx} path={path} element={<Component/>} />
        ))}
      </Routes>
    </Router>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
