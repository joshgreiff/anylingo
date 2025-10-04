'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const API_URL = 'https://anylingo-production.up.railway.app'

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    nativeLanguage: '',
    targetLanguage: '',
    promoCode: '',
    terms: false
  })

  useEffect(() => {
    // Check if we should show login form based on URL hash or search params
    const showLogin = window.location.hash === '#login' || searchParams.get('mode') === 'login'
    setIsLogin(showLogin)
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const toggleMode = () => {
    const newMode = !isLogin
    setIsLogin(newMode)
    if (newMode) {
      router.push('/signup?mode=login', { scroll: false })
    } else {
      router.push('/signup', { scroll: false })
    }
    setMessage('')
  }

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const formData = new FormData(e.currentTarget)
      const fullName = formData.get("fullName") as string
      const nameParts = fullName.trim().split(" ")
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(" ") || nameParts[0]
      const email = formData.get("email") as string
      
      // Check if email already exists before proceeding
      const checkResponse = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const checkData = await checkResponse.json()

      if (checkData.exists) {
        setMessage("An account with this email already exists. Please log in instead.")
        setMessageType("error")
        setLoading(false)
        return
      }
      
      const userData = {
        firstName,
        lastName,
        email,
        password: formData.get("password") as string,
        preferences: {
          nativeLanguage: formData.get("nativeLanguage") as string,
          targetLanguages: [formData.get("targetLanguage") as string]
        },
        promoCode: formData.get("promoCode") as string
      }

      // Store user data locally instead of creating account
      localStorage.setItem("anylingo_pending_user", JSON.stringify(userData))
      
      setMessage("Information saved! Redirecting to payment...")
      setMessageType("success")
      
      // Always redirect to payment (no promo code bypass)
      setTimeout(() => {
        router.push("/payment")
      }, 1500)
      
    } catch (error) {
      setMessage("Error checking email. Please try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData(e.currentTarget)
      const loginData = {
        email: formData.get('loginEmail'),
        password: formData.get('loginPassword')
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Login successful! Redirecting...')
        setMessageType('success')
        
        // Store user data
        localStorage.setItem('anylingo_token', data.token)
        localStorage.setItem('anylingo_user_data', JSON.stringify(data.user))
        
        // Redirect to app
        setTimeout(() => {
          router.push('/app')
        }, 1000)
      } else {
        setMessage(data.message || 'Login failed')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Network error. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      {/* Load external stylesheets */}
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      <link href="/css/landing.css" rel="stylesheet" />

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">AnyLingo™</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">Back to Home</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isLogin ? 'Welcome Back to AnyLingo' : 'Start Your Language Learning Journey'}
            </h1>
            <p className="text-xl text-gray-600">
              {isLogin ? 'Sign in to continue your language learning' : 'Join thousands of learners who have discovered the power of subconscious language training'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Auth Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Toggle Buttons */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setIsLogin(false)
                    router.push('/signup', { scroll: false })
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    !isLogin ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => {
                    setIsLogin(true)
                    router.push('/signup?mode=login', { scroll: false })
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    isLogin ? 'bg-white text-green-600 shadow' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Log In
                </button>
              </div>

              {!isLogin ? (
                // Signup Form
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Your Account</h2>
                  <form id="signup-form" className="space-y-6" onSubmit={handleSignup}>
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        required 
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        required 
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        required 
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">Must be at least 8 characters</p>
                    </div>

                    <div>
                      <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-700 mb-2">Native Language</label>
                      <select 
                        id="nativeLanguage" 
                        name="nativeLanguage" 
                        required 
                        value={formData.nativeLanguage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select your native language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">Target Language (Learning)</label>
                      <select 
                        id="targetLanguage" 
                        name="targetLanguage" 
                        required 
                        value={formData.targetLanguage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-2">Promo Code (Optional)</label>
                      <input 
                        type="text" 
                        id="promoCode" 
                        name="promoCode" 
                        value={formData.promoCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter promo code if you have one"
                      />
                      <p className="text-sm text-gray-500 mt-1">Have a promo code? Enter it here for special access</p>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input 
                        type="checkbox" 
                        id="terms" 
                        name="terms" 
                        required 
                        checked={formData.terms}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700">
                        I agree to the <a href="#terms" className="text-blue-600 hover:text-blue-800">Terms of Service</a> and{' '}
                        <a href="#privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
                    >
                      {loading ? 'Creating Account...' : 'Create Account - Start Free Trial'}
                    </button>
                  </form>
                </>
              ) : (
                // Login Form
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome Back</h2>
                  <form id="login-form" className="space-y-6" onSubmit={handleLogin}>
                    <div>
                      <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        id="loginEmail" 
                        name="loginEmail" 
                        required 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input 
                        type="password" 
                        id="loginPassword" 
                        name="loginPassword" 
                        required 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors"
                    >
                      {loading ? 'Signing In...' : 'Log In'}
                    </button>
                  </form>
                </>
              )}

              {/* Message Display */}
              {message && (
                <div className={`mt-4 p-3 rounded-md ${
                  messageType === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Switch Mode Link */}
              <div className="mt-6 text-center">
                <button 
                  onClick={toggleMode}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </div>

            {/* Trial Info */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">7-Day Free Trial</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">No credit card required to start</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Full access to all features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">Cancel anytime during trial</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">What You'll Get</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>✨ AI-powered personalized lessons</li>
                  <li>🧠 Subconscious training drills</li>
                  <li>🎯 Guided self-learning system</li>
                  <li>📊 Progress tracking</li>
                  <li>🎤 Recording and playback features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  )
} 