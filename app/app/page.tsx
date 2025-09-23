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
        {/* Header with Navigation */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 shadow-md">
          <div className="container mx-auto flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">AnyLingo</h1>
            </div>
            
            <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-2 md:mt-0">
              <button 
                onClick={() => updateView('lessons')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'lessons' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-500 hover:bg-blue-400 text-white'
                }`}
              >
                My Lessons
              </button>
              
              <button 
                onClick={() => updateView('create')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'create' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                Create a New Lesson
              </button>
              
              <button 
                onClick={() => updateView('content')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'content' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                }`}
              >
                Content
              </button>
              
              <button 
                onClick={() => updateView('readaloud')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'readaloud' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                ReadAloud
              </button>
              
              <button 
                onClick={() => updateView('drills')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'drills' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                Training Drills
              </button>
              
              <button 
                onClick={() => updateView('recording')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'recording' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                Recording
              </button>
              
              <button 
                onClick={() => updateView('account')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'account' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                Account
              </button>
              
              <button 
                onClick={() => updateView('settings')}
                className={`px-4 py-2 rounded-md shadow transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-white text-blue-600' 
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                Settings
              </button>

              <button 
                id="logoutBtn" 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow transition-colors ml-4"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="container mx-auto p-4">

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