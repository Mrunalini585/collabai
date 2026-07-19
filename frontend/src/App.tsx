import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import AIAssistant from './pages/AIAssistant'
import RequirementAnalyzer from './pages/RequirementAnalyzer'
import Meetings from './pages/Meetings'
import GitHubPage from './pages/GitHubPage'
import Reports from './pages/Reports'
import Chat from './pages/Chat'
import Admin from './pages/Admin'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/requirements" element={<RequirementAnalyzer />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/github" element={<GitHubPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/chat" element={<Chat />} />
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <Admin />
            </RoleRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
