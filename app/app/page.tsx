'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AccountManagement from '../components/AccountManagement'

function AppPageContent() {
  const [currentView, setCurrentView] = useState('home')
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentDrill, setCurrentDrill] = useState<string | null>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLooping, setIsLooping] = useState(false)
  const [speechRate, setSpeechRate] = useState(1.0)
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [currentHighlightedWord, setCurrentHighlightedWord] = useState<number | null>(null)
  const [highlightInterval, setHighlightInterval] = useState<NodeJS.Timeout | null>(null)
  const [words, setWords] = useState<string[]>([])
  const [wordBoundaries, setWordBoundaries] = useState<any[]>([])
  const [speechStartTime, setSpeechStartTime] = useState(0)
  const [estimatedDuration, setEstimatedDuration] = useState(0)
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
    
    // Load current lesson from localStorage
    const savedCurrentLesson = localStorage.getItem('currentLesson')
    if (savedCurrentLesson) {
      try {
        setCurrentLesson(JSON.parse(savedCurrentLesson))
      } catch (error) {
        console.error('Error loading current lesson:', error)
      }
    }
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
          content: {
            original: content
          },
          languages: {
            source: 'en',
            target: language
          },
          category: 'other',
          difficulty: 'beginner'
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

  const deleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${lessonTitle}"? This action cannot be undone.`)) {
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://anylingo-production.up.railway.app'}/api/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMessage('Lesson deleted successfully!')
        loadLessons() // Reload lessons
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to delete lesson')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      setMessage('Error deleting lesson')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  const clearForm = () => {
    ;(document.getElementById('lessonTitle') as HTMLInputElement).value = ''
    ;(document.getElementById('lessonContent') as HTMLTextAreaElement).value = ''
  }

  const handleLogout = () => {
    console.log('Logout button clicked!')
    try {
      // Clear all localStorage data
      localStorage.removeItem('anylingo_token')
      localStorage.removeItem('anylingo_user_data')
      localStorage.removeItem('anylingo_pending_user')
      console.log('LocalStorage cleared')
      
      // Redirect to signup page
      console.log('Redirecting to signup...')
      router.push('/signup')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const setActiveLesson = (lesson: any) => {
    setCurrentLesson(lesson)
    localStorage.setItem('currentLesson', JSON.stringify(lesson))
    setMessage(`Active lesson set to: ${lesson.title}`)
    setTimeout(() => setMessage(''), 3000)
  }

  const startEditingLesson = (lesson: any) => {
    setEditingLesson(lesson)
  }

  const cancelEditingLesson = () => {
    setEditingLesson(null)
  }

  const updateLesson = async () => {
    if (!editingLesson) return

    setLoading(true)
    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://anylingo-production.up.railway.app'}/api/lessons/${editingLesson._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editingLesson.title,
          content: {
            original: editingLesson.content?.original || editingLesson.content
          },
          languages: editingLesson.languages || {
            source: 'en',
            target: editingLesson.targetLanguage || 'es'
          },
          category: editingLesson.category || 'other',
          difficulty: editingLesson.difficulty || 'beginner'
        })
      })

      if (response.ok) {
        setMessage('Lesson updated successfully!')
        setEditingLesson(null)
        // Update current lesson if it was being edited
        if (currentLesson?._id === editingLesson._id) {
          setCurrentLesson(editingLesson)
          localStorage.setItem('currentLesson', JSON.stringify(editingLesson))
        }
        // Reload lessons
        loadLessons()
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to update lesson')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error updating lesson:', error)
      setMessage('Error updating lesson')
      setTimeout(() => setMessage(''), 3000)
    }
    setLoading(false)
  }

  const translateText = async (text: string, sourceLang: string, targetLang: string) => {
    try {
      // Use free Google Translate service (no API key required)
      const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang === 'auto' ? 'auto' : sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      
      const response = await fetch(fallbackUrl)
      
      if (response.ok) {
        const data = await response.json()
        
        // Check if we got a valid translation
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          return data[0][0][0]
        } else {
          throw new Error('Incomplete translation response')
        }
      } else {
        throw new Error(`Translation failed: ${response.status}`)
      }
    } catch (error) {
      // Try alternative free translation service
      try {
        const alternativeUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang === 'auto' ? 'auto' : sourceLang}|${targetLang}`
        
        const altResponse = await fetch(alternativeUrl)
        
        if (altResponse.ok) {
          const altData = await altResponse.json()
          
          if (altData && altData.responseData && altData.responseData.translatedText) {
            return altData.responseData.translatedText
          } else {
            throw new Error('Incomplete translation response')
          }
        }
      } catch (altError) {
        console.error('Alternative translation error:', altError)
      }
      
      throw new Error('Translation service unavailable. Please try again later.')
    }
  }

  const translateContent = async () => {
    if (!currentLesson) {
      setMessage('No active lesson to translate')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    const sourceLanguage = (document.getElementById('sourceLanguage') as HTMLSelectElement)?.value
    const targetLanguage = (document.getElementById('targetLanguage') as HTMLSelectElement)?.value
    const translationMode = (document.querySelector('input[name="translationMode"]:checked') as HTMLInputElement)?.value
    const originalTextElement = document.getElementById('originalText') as HTMLTextAreaElement
    const translatedTextElement = document.getElementById('translatedText') as HTMLDivElement

    if (targetLanguage === 'auto') {
      setMessage('Please select a target language.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    translatedTextElement.innerHTML = '<p class="text-center text-gray-500">Translating...</p>'

    try {
      const textToTranslate = originalTextElement.value || (currentLesson.content?.original || currentLesson.content)
      
      if (translationMode === 'sentence') {
        // Split into sentences and translate each
        const sentences = textToTranslate
          .split(/(?<=[.!?])\s+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
        
        let translatedHtml = ''
        
        for (const sentence of sentences) {
          const translated = await translateText(sentence, sourceLanguage, targetLanguage)
          translatedHtml += `<p class="mb-2"><strong>Original:</strong> ${sentence}</p><p class="mb-4 text-blue-700"><strong>Translation:</strong> ${translated}</p>`
        }
        
        translatedTextElement.innerHTML = translatedHtml
      } else if (translationMode === 'paragraph') {
        // Split into paragraphs and translate each
        const paragraphs = textToTranslate.split(/\n\s*\n/).filter((p: string) => p.trim())
        
        let translatedHtml = ''
        
        for (const paragraph of paragraphs) {
          const translated = await translateText(paragraph.trim(), sourceLanguage, targetLanguage)
          translatedHtml += `<div class="mb-4"><p class="mb-2"><strong>Original:</strong></p><p class="mb-2">${paragraph}</p><p class="mb-2 text-blue-700"><strong>Translation:</strong></p><p class="text-blue-700">${translated}</p></div>`
        }
        
        translatedTextElement.innerHTML = translatedHtml
      } else {
        // Full text translation
        const translated = await translateText(textToTranslate, sourceLanguage, targetLanguage)
        translatedTextElement.innerHTML = `<p>${translated}</p>`
      }
      
      setMessage('Translation completed successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Translation error:', error)
      translatedTextElement.innerHTML = '<p class="text-red-500 text-center">Translation failed. Please try again.</p>'
      setMessage('Translation failed. Please try again.')
      setTimeout(() => setMessage(''), 3000)
    }
    
    setLoading(false)
  }

  const startReading = () => {
    if (!currentLesson || !window.speechSynthesis) {
      setMessage('Text-to-speech not supported or no active lesson')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    stopReading() // Stop any current reading
    
    const synth = window.speechSynthesis
    const text = currentLesson.content?.original || currentLesson.content
    const newUtterance = new SpeechSynthesisUtterance(text)
    
    // Set speech rate
    newUtterance.rate = speechRate
    
    newUtterance.onstart = () => {
      console.log('Speech started - setting up highlighting')
      setIsPlaying(true)
      setIsPaused(false)
      startWordHighlighting()
    }
    
    newUtterance.onend = () => {
      console.log('Speech ended - clearing highlights')
      setIsPlaying(false)
      setIsPaused(false)
      clearWordHighlights()
      if (isLooping) {
        setTimeout(() => startReading(), 1000)
      }
    }
    
    newUtterance.onpause = () => {
      console.log('Speech paused - clearing highlights')
      setIsPlaying(false)
      setIsPaused(true)
      clearWordHighlights()
    }
    
    newUtterance.onresume = () => {
      setIsPlaying(true)
      setIsPaused(false)
      startWordHighlighting()
    }
    
    setUtterance(newUtterance)
    synth.speak(newUtterance)
  }

  const pauseReading = () => {
    if (window.speechSynthesis && isPlaying) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
      setIsPaused(true)
    }
  }

  const continueReading = () => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume()
      setIsPlaying(true)
      setIsPaused(false)
    }
  }

  const stopReading = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(false)
      clearWordHighlights()
    }
  }

  const toggleLoop = () => {
    setIsLooping(!isLooping)
    setMessage(`Loop ${!isLooping ? 'enabled' : 'disabled'}`)
    setTimeout(() => setMessage(''), 2000)
  }

  const clearWordHighlights = () => {
    console.log('Clearing word highlights')
    if (highlightInterval) {
      clearInterval(highlightInterval)
      setHighlightInterval(null)
    }
    
    setCurrentHighlightedWord(null)
    setWordBoundaries([])
    
    // Restore original content
    if (currentLesson) {
      const contentElement = document.getElementById('readAloudContent')
      if (contentElement) {
        contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content?.original || currentLesson.content}</pre>`
      }
    }
  }

  const clearVisualHighlights = () => {
    console.log('Clearing visual highlights only')
    setCurrentHighlightedWord(null)
    
    // Restore original content
    if (currentLesson) {
      const contentElement = document.getElementById('readAloudContent')
      if (contentElement) {
        contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content?.original || currentLesson.content}</pre>`
      }
    }
  }

  const addWordHighlight = (wordIndex: number) => {
    console.log('Adding highlight to word', wordIndex)
    const contentElement = document.getElementById('readAloudContent')
    if (!contentElement) {
      console.log('Content element not found!')
      return
    }
    if (wordBoundaries.length === 0) {
      console.log('Word boundaries array is empty, skipping highlight')
      return
    }
    if (wordIndex >= wordBoundaries.length) {
      console.log('Word index out of bounds:', wordIndex, 'vs', wordBoundaries.length)
      return
    }
    
    const boundary = wordBoundaries[wordIndex]
    const content = currentLesson.content?.original || currentLesson.content
    
    // Create highlighted version
    const before = content.substring(0, boundary.start)
    const word = content.substring(boundary.start, boundary.end)
    const after = content.substring(boundary.end)
    
    console.log('Highlighting word:', word, 'at position', boundary.start, '-', boundary.end)
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}<span class="bg-green-300 text-green-800 px-1 rounded">${word}</span>${after}</pre>`
  }

  const removeWordHighlight = (wordIndex: number) => {
    const contentElement = document.getElementById('readAloudContent')
    if (!contentElement || wordIndex >= wordBoundaries.length) return
    
    const boundary = wordBoundaries[wordIndex]
    const content = currentLesson.content?.original || currentLesson.content
    
    // Remove highlight by restoring original text
    const before = content.substring(0, boundary.start)
    const word = content.substring(boundary.start, boundary.end)
    const after = content.substring(boundary.end)
    
    contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}${word}${after}</pre>`
  }

  const startWordHighlighting = () => {
    console.log('Starting word highlighting...')
    if (!currentLesson) {
      console.log('Cannot start highlighting: no currentLesson')
      return
    }
    
    // Clear any existing visual highlights (but keep interval running if needed)
    clearVisualHighlights()
    
    const content = currentLesson.content?.original || currentLesson.content
    const wordsArray = content.split(/\s+/)
    console.log('Words to highlight:', wordsArray.length, 'words')
    setWords(wordsArray)
    
    // Create word boundaries for highlighting
    const boundaries: any[] = []
    let currentPos = 0
    wordsArray.forEach((word: string, index: number) => {
      const wordStart = content.indexOf(word, currentPos)
      const wordEnd = wordStart + word.length
      boundaries.push({
        word: word,
        start: wordStart,
        end: wordEnd,
        index: index
      })
      currentPos = wordEnd
    })
    setWordBoundaries(boundaries)
    console.log('Word boundaries created:', boundaries.length)
    
    // Calculate estimated duration
    const wordsPerMinute = 120 * speechRate
    const duration = (wordsArray.length / wordsPerMinute) * 60
    setEstimatedDuration(duration)
    const startTime = Date.now()
    setSpeechStartTime(startTime)
    console.log('Estimated duration:', duration, 'seconds, Start time:', startTime)
    
    // Start highlighting words based on speech timing
    // Store boundaries in closure to avoid React state issues
    const localBoundaries = [...boundaries]
    let currentHighlightIndex: number | null = null
    
    const interval = setInterval(() => {
      // Check if speech is still active (but be less strict about paused state)
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        console.log('Stopping highlighting - speech not active and not paused')
        clearInterval(interval)
        return
      }
      
      // Continue highlighting even if paused (for testing)
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        console.log('Speech not active at all, skipping highlight update')
        return
      }
      
      // Calculate word position based on speech progress
      const elapsedTime = Date.now() - startTime
      const timingFactor = 1.6 // Speed up factor for highlighting
      const adjustedElapsedTime = elapsedTime * timingFactor
      const progress = adjustedElapsedTime / (duration * 1000)
      const targetWordIndex = Math.floor(progress * wordsArray.length)
      
      console.log('Elapsed:', elapsedTime, 'Duration:', duration * 1000, 'Progress:', progress.toFixed(3), 'Target word:', targetWordIndex, '/', wordsArray.length, 'Current:', currentHighlightIndex)
      
      if (targetWordIndex !== currentHighlightIndex && targetWordIndex < wordsArray.length && targetWordIndex >= 0 && targetWordIndex < localBoundaries.length) {
        console.log('Highlighting word', targetWordIndex, ':', wordsArray[targetWordIndex])
        
        // Remove previous highlight
        if (currentHighlightIndex !== null) {
          // Restore original content
          const contentElement = document.getElementById('readAloudContent')
          if (contentElement && currentLesson) {
            contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${currentLesson.content?.original || currentLesson.content}</pre>`
          }
        }
        
        // Add new highlight directly
        const contentElement = document.getElementById('readAloudContent')
        if (contentElement && currentLesson && targetWordIndex < localBoundaries.length) {
          const boundary = localBoundaries[targetWordIndex]
          const content = currentLesson.content?.original || currentLesson.content
          
          // Create highlighted version
          const before = content.substring(0, boundary.start)
          const word = content.substring(boundary.start, boundary.end)
          const after = content.substring(boundary.end)
          
          contentElement.innerHTML = `<pre class="whitespace-pre-wrap">${before}<span class="bg-green-300 text-green-800 px-1 rounded">${word}</span>${after}</pre>`
          currentHighlightIndex = targetWordIndex
        }
      }
    }, 100) // Increased to 100ms for better debugging
    
    setHighlightInterval(interval)
    console.log('Highlighting interval started')
    
    // Test highlighting immediately
    setTimeout(() => {
      console.log('Testing manual highlight of first word')
      addWordHighlight(0)
    }, 500)
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
                onClick={handleLogout}
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
                  <p>Loading your lessons...</p>
                  <p className="text-sm mt-2">If you're a new user, default lessons should appear shortly.</p>
                </div>
              ) : (
                lessons.map((lesson: any) => (
                  <div key={lesson._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${currentLesson?._id === lesson._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    {editingLesson?._id === lesson._id ? (
                      // Editing mode
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={editingLesson.title}
                            onChange={(e) => setEditingLesson({...editingLesson, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea
                            rows={6}
                            value={editingLesson.content?.original || editingLesson.content}
                            onChange={(e) => setEditingLesson({
                              ...editingLesson, 
                              content: editingLesson.content?.original ? 
                                {...editingLesson.content, original: e.target.value} : 
                                e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={cancelEditingLesson}
                            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={updateLesson}
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                            {currentLesson?._id === lesson._id && (
                              <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">Active</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">
                            {(lesson.content?.original || lesson.content)?.substring(0, 100)}...
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Language: {(lesson.languages?.target || lesson.targetLanguage)?.toUpperCase()} • Created: {new Date(lesson.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {currentLesson?._id !== lesson._id && (
                            <button 
                              onClick={() => setActiveLesson(lesson)}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Set Active
                            </button>
                          )}
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">View</button>
                          <button 
                            onClick={() => startEditingLesson(lesson)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteLesson(lesson._id, lesson.title)}
                            disabled={loading}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
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
            
            {currentLesson ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Active Lesson: {currentLesson.title}</h3>
                  <p className="text-sm text-blue-700">Listen to your active lesson being read aloud</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Lesson Text:</h3>
                  <div id="readAloudContent" className="text-lg leading-relaxed mb-4 max-h-64 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{currentLesson.content?.original || currentLesson.content}</pre>
                  </div>
                  
                  <div className="flex space-x-3 mb-4">
                    <button 
                      onClick={startReading}
                      disabled={isPlaying || isPaused}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      ▶ {isPlaying ? 'Playing...' : 'Play'}
                    </button>
                    <button 
                      onClick={pauseReading}
                      disabled={!isPlaying}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      ⏸ Pause
                    </button>
                    <button 
                      onClick={continueReading}
                      disabled={!isPaused}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      ▶ Continue
                    </button>
                    <button 
                      onClick={stopReading}
                      disabled={!isPlaying && !isPaused}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      ⏹ Stop
                    </button>
                    <button 
                      onClick={toggleLoop}
                      className={`px-4 py-2 text-white rounded hover:opacity-90 ${isLooping ? 'bg-purple-600' : 'bg-gray-600'}`}
                    >
                      🔄 Loop {isLooping ? 'ON' : 'OFF'}
                    </button>
                    <button 
                      onClick={() => {
                        console.log('Manual highlight test - highlighting word 0')
                        if (currentLesson) {
                          addWordHighlight(0)
                          setTimeout(() => {
                            console.log('Manual highlight test - highlighting word 1')
                            addWordHighlight(1)
                          }, 1000)
                          setTimeout(() => {
                            console.log('Manual highlight test - highlighting word 2')
                            addWordHighlight(2)
                          }, 2000)
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    >
                      🔍 Test Highlight
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speech Rate: {speechRate}x</label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={speechRate}
                        onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                        className="w-full" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Browser Voice</label>
                      <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                        <option>Default Voice</option>
                        <option>System Voice 1</option>
                        <option>System Voice 2</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Voice selection depends on your browser and system</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No active lesson selected</p>
                <p className="text-sm">Go to the Content section and click "Set Active" on a lesson to start reading aloud.</p>
              </div>
            )}
          </section>

          {/* Translation Section */}
          <section id="translate" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'translate' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">Translation</h2>
            
            {currentLesson ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Active Lesson: {currentLesson.title}</h3>
                  <p className="text-sm text-blue-700">Working with your active lesson content</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From Language</label>
                    <select 
                      id="sourceLanguage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ru">Russian</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="ar">Arabic</option>
                      <option value="hi">Hindi</option>
                      <option value="fi">Finnish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">To Language</label>
                    <select 
                      id="targetLanguage"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                      <option value="pt">Portuguese</option>
                      <option value="ru">Russian</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                      <option value="ko">Korean</option>
                      <option value="ar">Arabic</option>
                      <option value="hi">Hindi</option>
                      <option value="fi">Finnish</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Translation Mode</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" name="translationMode" value="sentence" defaultChecked className="mr-2" />
                      Sentence by Sentence
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name="translationMode" value="paragraph" className="mr-2" />
                      Paragraph by Paragraph
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" name="translationMode" value="full" className="mr-2" />
                      Full Text
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Text</label>
                    <textarea 
                      id="originalText"
                      rows={8} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={currentLesson.content?.original || currentLesson.content}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Translation</label>
                    <div 
                      id="translatedText" 
                      className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto"
                    >
                      <p className="text-gray-500 text-center">Translation will appear here...</p>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={translateContent}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Translating...' : 'Translate'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">No active lesson selected</p>
                <p className="text-sm">Go to the Content section and click "Set Active" on a lesson to start working with it.</p>
              </div>
            )}
          </section>

          {/* Drills Section */}
          <section id="drills" className={`max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md ${currentView === 'drills' ? 'block' : 'hidden'}`}>
            <h2 className="text-2xl font-bold mb-6">Drill Exercises</h2>
            
            {/* Drill Selection Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <button 
                onClick={() => setCurrentDrill('drill1')}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${currentDrill === 'drill1' ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
              >
                <h3 className="text-lg font-semibold mb-2">Drill 1: Listen and Follow</h3>
                <p className="text-gray-600 text-sm">Listen to the lesson being read aloud and follow along with the text</p>
              </button>
              
              <button 
                onClick={() => setCurrentDrill('drill2')}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${currentDrill === 'drill2' ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
              >
                <h3 className="text-lg font-semibold mb-2">Drill 2: Highlight and Translate</h3>
                <p className="text-gray-600 text-sm">Highlight words or phrases you don't understand, then translate them</p>
              </button>
              
              <a 
                href="https://anylingo03.manus.space/" 
                target="_blank" 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block"
              >
                <h3 className="text-lg font-semibold mb-2">Drill 3: Listening Comprehension</h3>
                <p className="text-gray-600 text-sm mb-3">Advanced listening exercises</p>
                <div className="text-blue-600 hover:text-blue-800 text-sm font-medium">Open External Tool →</div>
              </a>
              
              <button 
                onClick={() => setCurrentDrill('drill4')}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${currentDrill === 'drill4' ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
              >
                <h3 className="text-lg font-semibold mb-2">Drill 4: Record and Compare</h3>
                <p className="text-gray-600 text-sm">Record yourself reading the lesson and compare with the original</p>
              </button>
              
              <button 
                onClick={() => setCurrentDrill('drill5')}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${currentDrill === 'drill5' ? 'bg-blue-50 border-blue-500' : 'border-gray-200'}`}
              >
                <h3 className="text-lg font-semibold mb-2">Drill 5: Develop Fluency</h3>
                <p className="text-gray-600 text-sm">Develop fluency using the fluency measurement tool</p>
              </button>
            </div>

            {/* Drill 1: Listen and Follow */}
            {currentDrill === 'drill1' && (
              <div className="space-y-4">
                <p className="text-gray-700">Listen to the lesson being read aloud and follow along with the text. This helps with comprehension and pronunciation.</p>
                
                <div className="flex space-x-4">
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition-colors">
                    Start
                  </button>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors" disabled>
                    Pause
                  </button>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors" disabled>
                    Continue
                  </button>
                  <button className="px-6 py-3 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors" disabled>
                    Stop
                  </button>
                </div>
                
                <div className="border p-4 rounded-md bg-gray-50 h-96 overflow-y-auto">
                  {currentLesson ? (
                    <pre className="whitespace-pre-wrap">{currentLesson.content?.original || currentLesson.content}</pre>
                  ) : (
                    <p className="text-gray-500 text-center">No active lesson. Go to Content section and click "Set Active" on a lesson.</p>
                  )}
                </div>
              </div>
            )}

            {/* Drill 2: Highlight and Translate */}
            {currentDrill === 'drill2' && (
              <div className="space-y-4">
                <p className="text-gray-700">Highlight words or phrases you don't understand, then translate them.</p>
                
                <div className="flex space-x-4">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors">
                    Enable Highlighting
                  </button>
                  <button className="px-6 py-3 bg-gray-600 text-white rounded-md shadow hover:bg-gray-700 transition-colors">
                    Clear Highlights
                  </button>
                </div>
                
                <div className="border p-4 rounded-md bg-gray-50 h-96 overflow-y-auto cursor-text">
                  {currentLesson ? (
                    <div className="whitespace-pre-wrap">{currentLesson.content?.original || currentLesson.content}</div>
                  ) : (
                    <p className="text-gray-500 text-center">No active lesson. Go to Content section and click "Set Active" on a lesson.</p>
                  )}
                </div>
              </div>
            )}

            {/* Drill 4: Record and Compare */}
            {currentDrill === 'drill4' && (
              <div className="space-y-4">
                <p className="text-gray-700">Record yourself reading the lesson and compare with the original.</p>
                
                <div className="flex space-x-4">
                  <button className="px-6 py-3 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors">
                    Start Recording
                  </button>
                  <button className="px-6 py-3 bg-gray-600 text-white rounded-md shadow hover:bg-gray-700 transition-colors" disabled>
                    Stop Recording
                  </button>
                  <button className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors" disabled>
                    Play Recording
                  </button>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors" disabled>
                    Save Recording
                  </button>
                </div>
                
                <div className="border p-4 rounded-md bg-gray-50 h-96 overflow-y-auto">
                  {currentLesson ? (
                    <pre className="whitespace-pre-wrap">{currentLesson.content?.original || currentLesson.content}</pre>
                  ) : (
                    <p className="text-gray-500 text-center">No active lesson. Go to Content section and click "Set Active" on a lesson.</p>
                  )}
                </div>
              </div>
            )}

            {/* Drill 5: Develop Fluency */}
            {currentDrill === 'drill5' && (
              <div className="space-y-4">
                <p className="text-gray-700">Develop fluency and measure it quantitatively using the fluency measurement tool.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custom Lesson Text</label>
                    <textarea 
                      rows={8} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={currentLesson ? (currentLesson.content?.original || currentLesson.content) : ''}
                      placeholder="Enter text for fluency practice..."
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors">
                      Start Fluency Test
                    </button>
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors">
                      Calculate WPM
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Fluency Metrics</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Words per minute:</span>
                        <div className="font-semibold">-- WPM</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Accuracy:</span>
                        <div className="font-semibold">--%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Fluency Score:</span>
                        <div className="font-semibold">--/100</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Default state */}
            {!currentDrill && (
              <div className="text-center py-8 text-gray-500">
                <p>Select a drill exercise above to get started</p>
              </div>
            )}
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