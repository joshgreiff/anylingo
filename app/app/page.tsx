'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import AccountManagement from '../components/AccountManagement'

function AppPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentView, setCurrentView] = useState('lessons')

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('anylingo_token')
    if (!token) {
      router.push('/signup?mode=login')
      return
    }

    // Get view from URL params
    const view = searchParams.get('view') || 'lessons'
    setCurrentView(view)

    // Load the main application script
    const script = document.createElement('script')
    script.src = '/script.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="/script.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [router, searchParams])

  const updateView = (view: string) => {
    setCurrentView(view)
    router.push(`/app?view=${view}`, { scroll: false })
  }

  return (
    <>
      {/* Load external stylesheets */}
      <link href="/app-styles.css" rel="stylesheet" />
      
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">AnyLingo</h1>
            <button 
              id="logoutBtn" 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container mx-auto p-4">
          {/* Navigation Tabs */}
          <div className="mb-6">
            <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow">
              {[
                { key: 'lessons', label: 'My Lessons', icon: '📚' },
                { key: 'create', label: 'Create Lesson', icon: '➕' },
                { key: 'content', label: 'Content', icon: '📝' },
                { key: 'readaloud', label: 'Read Aloud', icon: '🔊' },
                { key: 'drills', label: 'Training Drills', icon: '🎯' },
                { key: 'recording', label: 'Recording', icon: '🎤' },
                { key: 'account', label: 'Account', icon: '👤' },
                { key: 'settings', label: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => updateView(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === tab.key
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Dynamic Content Areas */}
          <div className="space-y-6">
            {/* Lessons View */}
            <div id="lessonsSection" className={currentView === 'lessons' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">My Lessons</h2>
                <div id="lessonsList" className="space-y-4">
                  {/* Lessons will be populated by script.js */}
                </div>
              </div>
            </div>

            {/* Create Lesson View */}
            <div id="createLessonSection" className={currentView === 'create' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Create New Lesson</h2>
                {/* Create lesson form will be populated by script.js */}
              </div>
            </div>

            {/* Content View */}
            <div id="contentSection" className={currentView === 'content' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Content</h2>
                {/* Content will be populated by script.js */}
              </div>
            </div>

            {/* Read Aloud View */}
            <div id="readAloudSection" className={currentView === 'readaloud' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Read Aloud</h2>
                {/* Read aloud content will be populated by script.js */}
              </div>
            </div>

            {/* Training Drills View */}
            <div id="drillsSection" className={currentView === 'drills' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Training Drills</h2>
                {/* Drills content will be populated by script.js */}
              </div>
            </div>

            {/* Recording View */}
            <div id="recordingSection" className={currentView === 'recording' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Recording</h2>
                {/* Recording content will be populated by script.js */}
              </div>
            </div>

            {/* Account View */}
            <div id="accountSection" className={currentView === 'account' ? 'block' : 'hidden'}>
              <AccountManagement />
            </div>

            {/* Settings View */}
            <div id="settingsSection" className={currentView === 'settings' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                {/* Settings content will be populated by script.js */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export default function AppPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppPageContent />
    </Suspense>
  )
} 