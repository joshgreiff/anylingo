'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('anylingo_token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('anylingo_user_data') || '{}')
    if (userData.email) {
      setUserEmail(userData.email)
    }
  }, [router])

  const handlePlanSelection = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan)
  }

  const handlePayment = async () => {
    if (!selectedPlan) return

    setIsLoading(true)
    setError('')

    try {
      // For now, simulate payment success
      // TODO: Integrate with Square or Stripe
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to app
      router.push('/app')
    } catch (error) {
      setError('Payment failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">AnyLingo™</h1>
          </div>
          <div className="text-sm">
            <span className="text-blue-100">{userEmail}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 mt-8 max-w-4xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
              <span className="ml-2 text-green-600 font-medium">Account Created</span>
            </div>
            <div className="w-16 h-1 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <span className="ml-2 text-blue-600 font-medium">Choose Plan</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <span className="ml-2 text-gray-500">Complete</span>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AnyLingo!</h2>
          <p className="text-lg text-gray-600">Your account has been created successfully. Choose your subscription plan to start your language learning journey.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Monthly Plan */}
          <div className={`bg-white rounded-lg shadow-lg p-8 border-2 transition-colors cursor-pointer ${
            selectedPlan === 'monthly' ? 'border-blue-500' : 'border-gray-200 hover:border-blue-500'
          }`} onClick={() => handlePlanSelection('monthly')}>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">$2.99<span className="text-lg text-gray-500">/month</span></div>
              <p className="text-gray-600 mb-6">Perfect for getting started with language learning</p>
              
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Full access to AnyLingo platform
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  AI-powered personalized lessons
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Subconscious training drills
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Progress tracking
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Cancel anytime
                </li>
              </ul>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors">
                Choose Monthly Plan
              </button>
            </div>
          </div>

          {/* Annual Plan */}
          <div className={`bg-white rounded-lg shadow-lg p-8 border-2 relative transition-colors cursor-pointer ${
            selectedPlan === 'annual' ? 'border-green-500' : 'border-green-500 hover:border-green-600'
          }`} onClick={() => handlePlanSelection('annual')}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">Save 30%</span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual Plan</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">$24.99<span className="text-lg text-gray-500">/year</span></div>
              <div className="text-sm text-gray-500 mb-4">$2.08/month - Save $10.89!</div>
              <p className="text-gray-600 mb-6">Best value for serious language learners</p>
              
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Everything in Monthly Plan
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Priority customer support
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Advanced progress analytics
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Early access to new features
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  30% savings vs monthly
                </li>
              </ul>
              
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors">
                Choose Annual Plan
              </button>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        {selectedPlan && (
          <div className="text-center">
            <button
              onClick={handlePayment}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-semibold text-lg transition-colors"
            >
              Complete Payment - {selectedPlan === 'monthly' ? '$2.99' : '$24.99'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
