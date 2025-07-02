import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { AuthContextProvider } from './context/AuthContext'
import { Toaster } from './components/ui/sonner'

import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/Signup'
import DashboardLayout from './components/layout/DashboardLayout'
import AllSnippets from './pages/dashboard/AllSnippets'
import SnippetEditor from './components/snippets/SnippetEditor'
import SnippetView from './pages/dashboard/SnippetView'
import Folders from './pages/dashboard/Folders'
import Projects from './pages/dashboard/Projects'

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<AllSnippets />} />
              <Route path="snippets" element={<AllSnippets />} />
              <Route path="snippet/new" element={<SnippetEditor />} />
              <Route path="snippet/:id" element={<SnippetView />} />
              <Route path="snippet/:id/edit" element={<SnippetEditor />} />
              <Route path="folders" element={<Folders />} />
              <Route path="folders/:id" element={<Folders />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<Projects />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthContextProvider>
    </ThemeProvider>
  )
}

export default App