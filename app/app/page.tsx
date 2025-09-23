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
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">AnyLingo</h1>
              
              <div className="flex flex-wrap items-center space-x-2 mt-2 md:mt-0">
                <button 
                  onClick={() => updateView('lessons')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'lessons' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  My Lessons
                </button>
                
                <button 
                  onClick={() => updateView('create')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'create' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Create Lesson
                </button>
                
                <button 
                  onClick={() => updateView('content')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'content' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Content
                </button>
                
                <button 
                  onClick={() => updateView('readaloud')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'readaloud' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Read Aloud
                </button>
                
                <button 
                  onClick={() => updateView('drills')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'drills' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Training Drills
                </button>
                
                <button 
                  onClick={() => updateView('recording')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'recording' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Recording
                </button>
                
                <button 
                  onClick={() => updateView('account')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'account' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Account
                </button>
                
                <button 
                  onClick={() => updateView('settings')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'settings' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Settings
                </button>

                <button 
                  id="logoutBtn" 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium shadow transition-colors ml-4"
                >
                  Logout
                </button>
              </div>
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
                <h2 className="text-2xl font-bold mb-6 text-gray-900">My Lessons</h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Sample lessons */}
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg mb-2">Spanish Basics</h3>
                    <p className="text-gray-600 text-sm mb-3">Learn fundamental Spanish vocabulary and phrases</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Progress: 75%</span>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Continue</button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg mb-2">French Conversations</h3>
                    <p className="text-gray-600 text-sm mb-3">Practice common French conversation patterns</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Progress: 45%</span>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Continue</button>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg mb-2">German Grammar</h3>
                    <p className="text-gray-600 text-sm mb-3">Master essential German grammar rules</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Progress: 20%</span>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Continue</button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                    + Create New Lesson
                  </button>
                </div>
              </div>
            </div>

            {/* Create Lesson View */}
            <div id="createLessonSection" className={currentView === 'create' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Lesson</h2>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Title</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter lesson title..." />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                      <option>Italian</option>
                      <option>Portuguese</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Content</label>
                    <textarea rows={6} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your lesson content, vocabulary, or text to practice..."></textarea>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                      Create Lesson
                    </button>
                    <button type="button" className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors">
                      Save as Draft
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Content View */}
            <div id="contentSection" className={currentView === 'content' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Content Library</h2>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Quick Phrases</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Hello / Hola</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Play</button>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Thank you / Gracias</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Play</button>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>How are you? / ¿Cómo estás?</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Play</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Vocabulary Sets</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Colors (12 words)</span>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Study</button>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Food & Drinks (18 words)</span>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Study</button>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span>Family Members (10 words)</span>
                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Study</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Read Aloud View */}
            <div id="readAloudSection" className={currentView === 'readaloud' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Read Aloud Practice</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Current Text</h3>
                    <p className="text-lg leading-relaxed mb-4">
                      "Hola, me llamo María. Soy de España y vivo en Madrid. Me gusta mucho viajar y conocer nuevas culturas. ¿De dónde eres tú?"
                    </p>
                    <div className="flex space-x-3">
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                        🎤 Start Recording
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        🔊 Play Original
                      </button>
                      <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors">
                        Skip Text
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">85%</div>
                      <div className="text-sm text-gray-600">Pronunciation Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">12</div>
                      <div className="text-sm text-gray-600">Texts Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">45min</div>
                      <div className="text-sm text-gray-600">Practice Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Training Drills View */}
            <div id="drillsSection" className={currentView === 'drills' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Training Drills</h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <a href="https://anylingo01.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                    <h3 className="font-semibold text-lg mb-2">Drill 1: Vocabulary</h3>
                    <p className="text-gray-600 text-sm mb-3">Practice basic vocabulary recognition</p>
                    <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Drill →</div>
                  </a>
                  
                  <a href="https://anylingo02.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                    <h3 className="font-semibold text-lg mb-2">Drill 2: Phrases</h3>
                    <p className="text-gray-600 text-sm mb-3">Learn common phrases and expressions</p>
                    <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Drill →</div>
                  </a>
                  
                  <a href="https://anylingo03.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                    <h3 className="font-semibold text-lg mb-2">Drill 3: Listening</h3>
                    <p className="text-gray-600 text-sm mb-3">Improve listening comprehension skills</p>
                    <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Drill →</div>
                  </a>
                  
                  <a href="https://anylingo04.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                    <h3 className="font-semibold text-lg mb-2">Drill 4: Grammar</h3>
                    <p className="text-gray-600 text-sm mb-3">Master grammar rules and structure</p>
                    <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Drill →</div>
                  </a>
                  
                  <a href="https://anylingo05.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                    <h3 className="font-semibold text-lg mb-2">Drill 5: Conversation</h3>
                    <p className="text-gray-600 text-sm mb-3">Practice real conversation scenarios</p>
                    <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Drill →</div>
                  </a>
                  
                  <a href="https://anylingo06.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                    <h3 className="font-semibold text-lg mb-2">Drill 6: Advanced</h3>
                    <p className="text-gray-600 text-sm mb-3">Challenge yourself with advanced exercises</p>
                    <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open Drill →</div>
                  </a>
                </div>
              </div>
            </div>

            {/* Recording View */}
            <div id="recordingSection" className={currentView === 'recording' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Recording Practice</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl">🎤</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Record</h3>
                    <p className="text-gray-600 mb-4">Click the button below to start recording your pronunciation</p>
                    <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
                      Start Recording
                    </button>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Recent Recordings</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm">Spanish Lesson 1</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Play</button>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm">Pronunciation Practice</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Play</button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Recording Stats</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Recordings:</span>
                          <span className="font-medium">24</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Score:</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Best Score:</span>
                          <span className="font-medium">95%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account View */}
            <div id="accountSection" className={currentView === 'account' ? 'block' : 'hidden'}>
              <AccountManagement />
            </div>

            {/* Settings View */}
            <div id="settingsSection" className={currentView === 'settings' ? 'block' : 'hidden'}>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Learning Preferences</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Target Language</label>
                        <select className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                          <option>Italian</option>
                          <option>Portuguese</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Practice Goal</label>
                        <select className="w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>15 minutes</option>
                          <option>30 minutes</option>
                          <option>45 minutes</option>
                          <option>60 minutes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">Daily practice reminders</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Weekly progress updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-700">New feature announcements</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                      Save Settings
                    </button>
                  </div>
                </div>
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