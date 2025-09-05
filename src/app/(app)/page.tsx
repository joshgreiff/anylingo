'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AppPage() {
  const [userName, setUserName] = useState('User')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('anylingo_token')
    if (token) {
      setIsAuthenticated(true)
      // You could decode the token or fetch user info here
    } else {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login'
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('anylingo_token')
    window.location.href = '/'
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">AnyLingo</Link>
          </div>
          
          <div className="flex flex-wrap items-center space-x-2 md:space-x-4 mt-2 md:mt-0">
            <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow transition-colors">
              Create a New Lesson
            </button>
            
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors">
              Content
            </button>
            
            <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow transition-colors">
              ReadAloud
            </button>
            
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors">
              Translation
            </button>
            
            <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md shadow transition-colors">
              Drill Exercises
            </button>
            
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition-colors">
              Record
            </button>

            {/* User Menu */}
            <div className="relative">
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow transition-colors">
                <span>{userName} ▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Subscription</a>
                <hr className="my-1" />
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 mt-8">
        {/* Home/Welcome Section */}
        <section className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome to AnyLingo</h2>
          <p className="text-center mb-6">Develop fluency in multiple foreign languages</p>
          
          <div className="mb-6 p-4 rounded-md bg-green-100 text-green-700 text-center">
            AnyLingo is ready to use! Click on any of the buttons above to get started.
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-blue-50">
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Create Lessons</h3>
              <p className="text-gray-600 mb-4">
                Create new language lessons by pasting text from any source. AnyLingo preserves the original text formatting.
              </p>
              <button className="text-blue-600 hover:text-blue-800">Create a lesson →</button>
            </div>
            
            <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-green-50">
              <h3 className="text-xl font-semibold mb-2 text-green-700">Manage Content</h3>
              <p className="text-gray-600 mb-4">
                Access all your saved lessons in the Content folder. View, edit, or delete your lessons.
              </p>
              <button className="text-green-600 hover:text-green-800">View content →</button>
            </div>
            
            <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-blue-50">
              <h3 className="text-xl font-semibold mb-2 text-blue-700">ReadAloud</h3>
              <p className="text-gray-600 mb-4">
                Practice pronunciation with text-to-speech technology. Hear how words should sound.
              </p>
              <button className="text-blue-600 hover:text-blue-800">Start reading →</button>
            </div>
            
            <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-green-50">
              <h3 className="text-xl font-semibold mb-2 text-green-700">Translation</h3>
              <p className="text-gray-600 mb-4">
                Get instant translations and understand the meaning of words and phrases.
              </p>
              <button className="text-green-600 hover:text-green-800">Translate now →</button>
            </div>
            
            <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-blue-50">
              <h3 className="text-xl font-semibold mb-2 text-blue-700">Drill Exercises</h3>
              <p className="text-gray-600 mb-4">
                Practice with interactive exercises designed to reinforce your learning.
              </p>
              <button className="text-blue-600 hover:text-blue-800">Start drills →</button>
            </div>
            
            <div className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow bg-green-50">
              <h3 className="text-xl font-semibold mb-2 text-green-700">Record & Practice</h3>
              <p className="text-gray-600 mb-4">
                Record yourself speaking and compare with native pronunciation.
              </p>
              <button className="text-green-600 hover:text-green-800">Start recording →</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
} 