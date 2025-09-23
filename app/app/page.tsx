'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AccountManagement from '../components/AccountManagement'

function AppPageContent() {
  const [currentView, setCurrentView] = useState('home')
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('anylingo_token')
    if (!token) {
      router.push('/signup')
      return
    }

    // Get view from URL params
    const view = searchParams.get('view') || 'home'
    setCurrentView(view)
    
    // Load lessons on mount
    loadLessons()
  }, [router, searchParams])

  const updateView = (view: string) => {
    setCurrentView(view)
    router.push(`/app?view=${view}`)
  }

  const showSection = (section: string) => {
    setCurrentView(section)
    router.push(`/app?view=${section}`)
  }

  const loadLessons = async () => {
    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://anylingo-production.up.railway.app'}/api/lessons`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error loading lessons:', error)
    }
  }

  const saveLesson = async () => {
    const title = (document.getElementById('lessonTitle') as HTMLInputElement)?.value
    const language = (document.getElementById('targetLanguage') as HTMLSelectElement)?.value
    const content = (document.getElementById('lessonContent') as HTMLTextAreaElement)?.value

    if (!title || !content) {
      setMessage('Please fill in both title and content')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://anylingo-production.up.railway.app'}/api/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          targetLanguage: language,
          content
        })
      })

      if (response.ok) {
        setMessage('Lesson saved successfully!')
        // Clear form
        ;(document.getElementById('lessonTitle') as HTMLInputElement).value = ''
        ;(document.getElementById('lessonContent') as HTMLTextAreaElement).value = ''
        // Reload lessons
        loadLessons()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save lesson')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error saving lesson:', error)
      setMessage('Error saving lesson')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  const clearForm = () => {
    ;(document.getElementById('lessonTitle') as HTMLInputElement).value = ''
    ;(document.getElementById('lessonContent') as HTMLTextAreaElement).value = ''
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="header p-4 shadow-md" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
          <div className="container mx-auto flex flex-wrap items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">AnyLingo</h1>
            </div>
            
            <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-2 md:mt-0">
              <button 
                onClick={() => updateView('createLesson')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition-colors"
              >
                Create a New Lesson
              </button>
              
              <button 
                onClick={() => updateView('content')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors"
              >
                Content
              </button>
              
              <button 
                onClick={() => updateView('readAloud')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition-colors"
              >
                ReadAloud
              </button>
              
              <button 
                onClick={() => updateView('translate')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors"
              >
                Translation
              </button>
              
              <button 
                onClick={() => updateView('drills')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow transition-colors"
              >
                Drill Exercises
              </button>
              
              <button 
                onClick={() => updateView('record')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors"
              >
                Record
              </button>

              <button 
                id="logoutBtn" 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md shadow transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto p-4 mt-8">
          {/* Home/Welcome Section */}
          <section id="home" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'home' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6 text-center">Welcome to AnyLingo</h2>
            <p className="text-center mb-6">Develop fluency in multiple foreign languages</p>
            
            <div id="statusMessage" className="mb-6 p-4 rounded-md bg-green-100 text-green-700 text-center">
              AnyLingo is ready to use! Click on any of the buttons above to get started.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-blue-50">
                <h3 className="text-xl font-semibold mb-2 text-blue-700">Create Lessons</h3>
                <p className="text-gray-600 mb-4">
                  Create new language lessons by pasting text from any source. AnyLingo preserves the original text formatting.
                </p>
                <button className="text-blue-600 hover:text-blue-800" onClick={() => showSection('createLesson')}>Create a lesson →</button>
              </div>
              
              <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-green-50">
                <h3 className="text-xl font-semibold mb-2 text-green-700">Manage Content</h3>
                <p className="text-gray-600 mb-4">
                  Access all your saved lessons in the Content folder. View, edit, or delete your lessons.
                </p>
                <button className="text-green-600 hover:text-green-800" onClick={() => showSection('content')}>View content →</button>
              </div>
              
              <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-blue-50">
                <h3 className="text-xl font-semibold mb-2 text-blue-700">ReadAloud</h3>
                <p className="text-gray-600 mb-4">
                  Listen to your lessons with text-to-speech technology. Control voice, speed, and playback options.
                </p>
                <button className="text-blue-600 hover:text-blue-800" onClick={() => showSection('readAloud')}>Use ReadAloud →</button>
              </div>
              
              <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-green-50">
                <h3 className="text-xl font-semibold mb-2 text-green-700">Translation</h3>
                <p className="text-gray-600 mb-4">
                  Translate your lessons between multiple languages. Choose to translate sentences, paragraphs, or entire lessons.
                </p>
                <button className="text-green-600 hover:text-green-800" onClick={() => showSection('translate')}>Translate content →</button>
              </div>
              
              <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-blue-50">
                <h3 className="text-xl font-semibold mb-2 text-blue-700">Drill Exercises</h3>
                <p className="text-gray-600 mb-4">
                  Practice with interactive drills designed to improve your language fluency and comprehension.
                </p>
                <button className="text-blue-600 hover:text-blue-800" onClick={() => showSection('drills')}>Start drills →</button>
              </div>
              
              <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-green-50">
                <h3 className="text-xl font-semibold mb-2 text-green-700">Recording</h3>
                <p className="text-gray-600 mb-4">
                  Record your pronunciation and compare it with native speakers to improve your accent.
                </p>
                <button className="text-green-600 hover:text-green-800" onClick={() => showSection('record')}>Start recording →</button>
              </div>
            </div>
          </section>

          {/* Create Lesson Section */}
          <section id="createLesson" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'createLesson' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">Create a New Lesson</h2>
            
            {message && (
              <div className={`mb-4 p-3 rounded-md ${message.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            <form className="space-y-6">
              <div>
                <label htmlFor="lessonTitle" className="block text-sm font-medium text-gray-700 mb-2">Lesson Title</label>
                <input 
                  type="text" 
                  id="lessonTitle" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Enter a title for your lesson"
                />
              </div>
              
              <div>
                <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                <select id="targetLanguage" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="lessonContent" className="block text-sm font-medium text-gray-700 mb-2">Lesson Content</label>
                <textarea 
                  id="lessonContent" 
                  rows={10} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="Paste or type your lesson content here..."
                ></textarea>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  type="button" 
                  onClick={saveLesson}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Lesson'}
                </button>
                <button 
                  type="button" 
                  onClick={clearForm}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            </form>
          </section>

          {/* Content Section */}
          <section id="content" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'content' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">My Lessons</h2>
            
            <div className="space-y-4" id="lessonsList">
              {lessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No lessons created yet.</p>
                  <p className="text-sm mt-2">Click "Create New Lesson" to get started!</p>
                </div>
              ) : (
                lessons.map((lesson: any) => (
                  <div key={lesson._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {lesson.content?.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Language: {lesson.targetLanguage?.toUpperCase()} • Created: {new Date(lesson.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">View</button>
                        <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Edit</button>
                        <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6">
              <button 
                onClick={() => updateView('createLesson')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                + Create New Lesson
              </button>
            </div>
          </section>

          {/* ReadAloud Section */}
          <section id="readAloud" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'readAloud' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">ReadAloud</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select a lesson to read aloud:</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Spanish Basics</option>
                  <option>French Conversation</option>
                  <option>German Grammar</option>
                </select>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Current Text:</h3>
                <p className="text-lg leading-relaxed mb-4">
                  Hola, me llamo María. Soy de España y vivo en Madrid. Me gusta mucho viajar y conocer nuevas culturas.
                </p>
                
                <div className="flex space-x-3 mb-4">
                  <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">▶ Play</button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">⏸ Pause</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">⏹ Stop</button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Speech Rate</label>
                    <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                      <option>Spanish (Spain)</option>
                      <option>Spanish (Mexico)</option>
                      <option>Spanish (Argentina)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Translation Section */}
          <section id="translate" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'translate' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">Translation</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Language</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Language</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Original Text</label>
                  <textarea 
                    rows={8} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter text to translate..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Translation</label>
                  <textarea 
                    rows={8} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    placeholder="Translation will appear here..."
                    readOnly
                  ></textarea>
                </div>
              </div>
              
              <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Translate
              </button>
            </div>
          </section>

          {/* Drills Section */}
          <section id="drills" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'drills' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">Drill Exercises</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a href="https://anylingo01.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                <h3 className="text-lg font-semibold mb-2">Drill 1</h3>
                <p className="text-gray-600 text-sm mb-3">Basic vocabulary practice</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Drill →</div>
              </a>
              
              <a href="https://anylingo02.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                <h3 className="text-lg font-semibold mb-2">Drill 2</h3>
                <p className="text-gray-600 text-sm mb-3">Sentence construction</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Drill →</div>
              </a>
              
              <a href="https://anylingo03.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                <h3 className="text-lg font-semibold mb-2">Drill 3</h3>
                <p className="text-gray-600 text-sm mb-3">Listening comprehension</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Drill →</div>
              </a>
              
              <a href="https://anylingo04.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                <h3 className="text-lg font-semibold mb-2">Drill 4</h3>
                <p className="text-gray-600 text-sm mb-3">Grammar exercises</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Drill →</div>
              </a>
              
              <a href="https://anylingo05.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                <h3 className="text-lg font-semibold mb-2">Drill 5</h3>
                <p className="text-gray-600 text-sm mb-3">Conversation practice</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Drill →</div>
              </a>
              
              <a href="https://anylingo06.manus.space/" target="_blank" className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block">
                <h3 className="text-lg font-semibold mb-2">Drill 6</h3>
                <p className="text-gray-600 text-sm mb-3">Advanced exercises</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Start Drill →</div>
              </a>
            </div>
          </section>

          {/* Record Section */}
          <section id="record" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'record' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">Recording</h2>
            
            <div className="space-y-6">
              <div className="text-center bg-gray-50 p-8 rounded-lg">
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl">🎤</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Ready to Record</h3>
                <p className="text-gray-600 mb-4">Click the button below to start recording your pronunciation</p>
                <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-lg">
                  Start Recording
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Practice Text</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg leading-relaxed">
                      "Buenos días. ¿Cómo está usted? Me llamo Juan y soy de México."
                    </p>
                  </div>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    🔊 Play Original
                  </button>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recording Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Recordings:</span>
                      <span className="font-medium">15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Score:</span>
                      <span className="font-medium">82%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Best Score:</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Practice Time:</span>
                      <span className="font-medium">2h 15m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section id="account" className={`max-w-4xl mx-auto ${currentView === 'account' ? 'block' : 'hidden'}`}>
            <AccountManagement />
          </section>
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