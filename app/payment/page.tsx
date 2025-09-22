'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

const API_URL = 'https://anylingo-production.up.railway.app'

export default function PaymentPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [squarePayments, setSquarePayments] = useState<any>(null)
  const [card, setCard] = useState<any>(null)
  const [error, setError] = useState('')
  const [squareConfig, setSquareConfig] = useState<any>(null)

  useEffect(() => {
    // Check for pending user (new flow) or existing token (old flow)
    const pendingUser = localStorage.getItem('anylingo_pending_user')
    const token = localStorage.getItem('anylingo_token')
    
    if (pendingUser) {
      // New flow: user came from signup
      const userData = JSON.parse(pendingUser)
      if (userData.email) {
        setUserEmail(userData.email)
      }
      
      // Check for promo code bypass
      if (userData.promoCode && userData.promoCode.trim()) {
        const promoCode = userData.promoCode.trim().toUpperCase()
        if (isValidPromoCode(promoCode)) {
          // Create account with promo code benefits
          createAccountWithPromoCode(userData, promoCode)
          return
        } else {
          // Invalid promo code, show error and continue to payment
          setError(`Invalid promo code: "${userData.promoCode}". Proceeding to payment.`)
        }
      }
    } else if (token) {
      // Old flow: user already has account
      const userData = JSON.parse(localStorage.getItem('anylingo_user_data') || '{}')
      if (userData.email) {
        setUserEmail(userData.email)
      }
    } else {
      // No pending user or token, redirect to signup
      router.push('/signup')
      return
    }

    // Fetch Square configuration from backend
    fetchSquareConfig()
  }, [router])

  const isValidPromoCode = (code: string): boolean => {
    const validCodes = [
      'JOSH_LIFETIME',     // Your lifetime access code
      'FOUNDER_ACCESS',    // Alternative founder code
      'TESTING2025',       // Testing code
      'DEV_BYPASS'         // Developer bypass
    ]
    return validCodes.includes(code)
  }

  const createAccountWithPromoCode = async (userData: any, promoCode?: string) => {
    setIsLoading(true)
    try {
              // Create account with promo code benefits
        const accountData = {
          ...userData,
          promoCodeUsed: promoCode,
          subscriptionType: promoCode === 'JOSH_LIFETIME' ? 'lifetime' : 'promo_access'
        }
        
        const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(accountData)
        })

      const registerData = await registerResponse.json()

      if (registerResponse.ok) {
        // Store auth token
        localStorage.setItem('anylingo_token', registerData.token)
        localStorage.setItem('anylingo_user_data', JSON.stringify(registerData.user))
        
        // Clear pending user data
        localStorage.removeItem('anylingo_pending_user')
        
        // Redirect to app
        router.push('/app')
      } else {
        setError(registerData.message || 'Failed to create account. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error creating account with promo code:', error)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const loadSquareSDKManually = () => {
    if (!squareConfig) return
    
    const script = document.createElement('script')
    script.src = squareConfig.environment === 'production' 
      ? "https://web.squarecdn.com/v1/square.js" 
      : "https://sandbox.web.squarecdn.com/v1/square.js"
    
    script.onload = () => {
      console.log('Square SDK loaded manually')
      setTimeout(initializeSquare, 100)
    }
    
    script.onerror = () => {
      console.error('Manual Square SDK loading also failed')
      setError('Unable to load payment system. Please check your internet connection and try again.')
    }
    
    document.head.appendChild(script)
  }

  const fetchSquareConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/square-config`)
      if (response.ok) {
        const config = await response.json()
        setSquareConfig(config)
      } else {
        console.error('Failed to fetch Square config')
        setError('Unable to load payment system configuration.')
      }
    } catch (error) {
      console.error('Error fetching Square config:', error)
      setError('Unable to connect to payment system.')
    }
  }

  const initializeSquare = async () => {
    if (typeof window !== 'undefined' && (window as any).Square && squareConfig) {
      try {
        // Check if Square credentials are configured
        const { applicationId, locationId } = squareConfig
        
        if (!applicationId || !locationId) {
          setError('Square payment system is not configured. Please contact support.')
          return
        }
        
        console.log('Initializing Square with:', { applicationId, locationId, environment: squareConfig.environment })
        
        const payments = (window as any).Square.payments(applicationId, locationId)
        setSquarePayments(payments)
        
        // Check if card container exists
        const cardContainer = document.getElementById('card-container')
        if (!cardContainer) {
          throw new Error('Card container element not found')
        }

        const cardElement = await payments.card({
          style: {
            input: {
              fontSize: '16px',
              fontFamily: 'Arial',
              color: '#374151'
            },
            '.input-container.is-focus': {
              borderColor: '#3b82f6'
            },
            '.message-text': {
              color: '#ef4444'
            }
          }
        })
        await cardElement.attach('#card-container')
        setCard(cardElement)
        console.log('Square card element attached successfully')
        console.log('Card element tokenize method:', typeof cardElement.tokenize)
      } catch (error) {
        console.error('Failed to initialize Square:', error)
        setError('Payment system initialization failed. Please refresh and try again.')
      }
    } else {
      const missingParts = []
      if (typeof window === 'undefined') missingParts.push('window')
      if (!(window as any).Square) missingParts.push('Square SDK')
      if (!squareConfig) missingParts.push('Square config')
      
      console.log('Square initialization failed. Missing:', missingParts)
      setError(`Payment system is loading (missing: ${missingParts.join(', ')}). Please wait a moment and try again.`)
    }
  }

  // Initialize Square when config is loaded and payment form is shown
  useEffect(() => {
    if (squareConfig && showPaymentForm) {
      setTimeout(() => {
        initializeSquare()
      }, 100)
      
      // Fallback timeout - if Square doesn't load in 10 seconds, try manual loading
      const fallbackTimeout = setTimeout(() => {
        if (!(window as any).Square) {
          console.log('Square SDK timeout - attempting manual load')
          loadSquareSDKManually()
        }
      }, 10000)
      
      return () => clearTimeout(fallbackTimeout)
    }
  }, [squareConfig, showPaymentForm])

  const handlePlanSelection = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan)
    setShowPaymentForm(true)
    setError('') // Clear any previous errors
  }

  const handleStartTrialWithPayment = async () => {
    // FORCE clear all localStorage data at the start to ensure fresh state
    console.log('🧹 Force clearing all localStorage data at function start...')
    localStorage.removeItem('anylingo_token')
    localStorage.removeItem('anylingo_user_data') 
    localStorage.removeItem('anylingo_trial_info')
    
    if (!selectedPlan) {
      setError('Please select a plan.')
      return
    }

    if (!card) {
      setError('Payment form is not ready. Please wait for the form to load completely.')
      return
    }

    if (!squarePayments) {
      setError('Payment system is not initialized. Please refresh the page.')
      return
    }

    console.log('Payment submission - card object:', card)
    console.log('Payment submission - card.tokenize type:', typeof card.tokenize)

    setIsLoading(true)
    setError('')

    try {
      const tokenResult = await card.tokenize()
      
      if (tokenResult.status === 'OK') {
        // ALWAYS clear all tokens to force fresh account creation every time
        console.log('Force clearing all AnyLingo localStorage data...')
        localStorage.removeItem('anylingo_token')
        localStorage.removeItem('anylingo_user_data')
        localStorage.removeItem('anylingo_trial_info')
        
        let token = null // Always start fresh
        
        // If no token, create account first (new payment-first flow)
        if (!token) {
          console.log('No existing token, creating account first...')
          const pendingUser = localStorage.getItem('anylingo_pending_user')
          if (pendingUser) {
            const userData = JSON.parse(pendingUser)
            console.log('Creating account for:', userData.email)
            
            // Create account (using temporary endpoint while fixing main auth)
            const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData)
            })

            const registerData = await registerResponse.json()
            console.log('Register response status:', registerResponse.status)
            console.log('Register response data:', registerData)
            console.log('Register response headers:', Object.fromEntries(registerResponse.headers))
            
            // Log the full error details
            if (!registerResponse.ok) {
              console.error('Registration failed with details:', {
                status: registerResponse.status,
                statusText: registerResponse.statusText,
                data: registerData,
                url: registerResponse.url
              })
            }

            if (!registerResponse.ok) {
              setError(registerData.message || 'Failed to create account. Please try again.')
              return
            }

            // Store auth token and user data
            token = registerData.token
            console.log('New token received:', token ? 'Token exists' : 'No token')
            
            // Debug: Decode the JWT token to see what user ID it contains
            if (token) {
              try {
                const base64Payload = token.split('.')[1]
                const payload = JSON.parse(atob(base64Payload))
                console.log('JWT token payload:', payload)
                console.log('User ID in token:', payload.userId)
                console.log('User ID from response:', registerData.user._id)
                console.log('User IDs match:', payload.userId === registerData.user._id)
              } catch (e) {
                console.log('Could not decode JWT token:', e)
              }
            }
            
            localStorage.setItem('anylingo_token', registerData.token)
            localStorage.setItem('anylingo_user_data', JSON.stringify(registerData.user))
            localStorage.removeItem('anylingo_pending_user')
          } else {
            setError('Session expired. Please sign up again.')
            router.push('/signup')
            return
          }
        } else {
          console.log('Using existing token for trial creation')
        }

        // Ensure token is available
        if (!token) {
          setError('Authentication failed. Please try again.')
          return
        }

        console.log('Starting trial with token:', token.substring(0, 20) + '...')
        console.log('Trial request data:', { planType: selectedPlan, cardToken: tokenResult.token.substring(0, 20) + '...', trialDays: 7 })
        
        // Add a small delay to ensure database consistency after account creation
        if (!localStorage.getItem('anylingo_token')) {
          console.log('Adding delay after account creation for database consistency...')
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        }
        
        // Retry mechanism for trial creation
        let response: Response | undefined, data: any
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          response = await fetch(`${API_URL}/api/subscriptions/create-trial`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              planType: selectedPlan,
              cardToken: tokenResult.token,
              trialDays: 7
            })
          })

          data = await response.json()
          console.log(`Trial attempt ${retryCount + 1} - Status:`, response.status, 'Data:', data)

          if (response.ok) {
            break // Success, exit retry loop
          }
          
          // If it's a token/user issue and we have retries left, wait and try again
          if ((response.status === 401 || response.status === 404) && retryCount < maxRetries - 1) {
            console.log(`Retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            retryCount++
          } else {
            break // Other error or max retries reached
          }
        }

        if (response && response.ok) {
          localStorage.setItem('anylingo_trial_info', JSON.stringify({
            plan: selectedPlan,
            trialEndDate: data.trialEndDate,
            subscriptionId: data.subscriptionId
          }))
          
          router.push('/app')
        } else {
          setError(data?.error || 'Failed to start trial. Please try again.')
        }
      } else {
        setError('Payment information is invalid. Please check your card details.')
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      setError('Failed to process payment information. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Setting up your free trial...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {squareConfig && <Script 
        src={squareConfig.environment === 'production' 
          ? "https://web.squarecdn.com/v1/square.js" 
          : "https://sandbox.web.squarecdn.com/v1/square.js"
        } 
        onLoad={() => {
          console.log('Square SDK loaded successfully')
          console.log('Environment:', squareConfig.environment)
          console.log('Square object available:', typeof (window as any).Square)
        }}
        onError={(error) => {
          console.error('Failed to load Square SDK:', error)
          console.log('Attempting to load Square SDK manually...')
          loadSquareSDKManually()
        }}
      />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">AnyLingo™</h1>
            <span className="text-blue-100">{userEmail}</span>
          </div>
        </header>

        <main className="container mx-auto p-4 mt-8 max-w-4xl">
          {/* Free Trial Banner */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-6 mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">🎉 7-Day FREE Trial</h2>
            <p className="text-lg">Full access to everything • No charge for 7 days • Cancel anytime</p>
          </div>

          {!showPaymentForm ? (
            <>
              {/* Plan Selection */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Plan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Monthly Plan */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200 hover:border-blue-500 transition-colors">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Monthly</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-4">
                      $2.99<span className="text-lg text-gray-500">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">After 7-day free trial</p>
                    
                    <button 
                      onClick={() => handlePlanSelection('monthly')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                    >
                      Start Free Trial
                    </button>
                  </div>
                </div>

                {/* Annual Plan */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">Save 30%</span>
                  </div>
                  
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Annual</h4>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      $24.99<span className="text-lg text-gray-500">/year</span>
                    </div>
                    <div className="text-sm text-gray-500 mb-4">$2.08/month • Save $10.89!</div>
                    
                    <button 
                      onClick={() => handlePlanSelection('annual')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                    >
                      Start Free Trial
                    </button>
                  </div>
                </div>
              </div>

              {/* Simple Trust Indicators */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-green-600 text-2xl mb-2">✓</div>
                    <p className="text-sm text-gray-600">7 days completely free</p>
                  </div>
                  <div>
                    <div className="text-blue-600 text-2xl mb-2">🔒</div>
                    <p className="text-sm text-gray-600">Secure payment processing</p>
                  </div>
                  <div>
                    <div className="text-purple-600 text-2xl mb-2">↩</div>
                    <p className="text-sm text-gray-600">Cancel anytime during trial</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Payment Form */
            <div className="max-w-xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Your Free Trial</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-blue-800 font-semibold">
                      {selectedPlan === 'monthly' ? 'Monthly Plan - $2.99/month' : 'Annual Plan - $24.99/year'}
                    </p>
                    <p className="text-blue-700 text-sm">Starts {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Square Payment Form */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Information</label>
                  <div id="card-container" className="border border-gray-300 rounded-lg p-4 min-h-[60px]">
                    {/* Square will inject the card form here */}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartTrialWithPayment}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Start FREE Trial'}
                  </button>
                </div>

                {/* Simple Security Note */}
                <p className="text-center text-xs text-gray-500 mt-4">
                  🔒 Your payment info is secure and encrypted • No charges for 7 days
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
} 