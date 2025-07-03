import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { AuthContextProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ErrorBoundary } from './components/ui/error-boundary'
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
import Settings from './pages/dashboard/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import NewSnippet from './pages/dashboard/NewSnippet'

function App() {
  return (
    <ErrorBoundary fallbackMessage="Something went wrong with the application. Please refresh the page.">
      <ThemeProvider defaultTheme="dark">
        <AuthContextProvider>
          <DataProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AllSnippets />} />
                  <Route path="snippets" element={<AllSnippets />} />
                  <Route path="snippet/new" element={<NewSnippet />} />
                  <Route path="snippet/:id" element={<SnippetView />} />
                  <Route path="snippet/:id/edit" element={<SnippetEditor />} />
                  <Route path="folders" element={<Folders />} />
                  <Route path="folders/:id" element={<Folders />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<Projects />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Router>
            <Toaster />
          </DataProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App