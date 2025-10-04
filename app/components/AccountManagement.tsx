'use client'

import { useState, useEffect } from 'react'

const API_URL = 'https://anylingo-production.up.railway.app'

interface SubscriptionStatus {
  status: string
  plan: string
  nextBillingDate?: string
  trialEndDate?: string
  isTrialActive?: boolean
  canCancel?: boolean
  canUpgrade?: boolean
}

export default function AccountManagement() {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [nativeLanguage, setNativeLanguage] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('')
  const [savingLanguages, setSavingLanguages] = useState(false)

  useEffect(() => {
    fetchSubscriptionStatus()
    fetchUserPreferences()
  }, [])

  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNativeLanguage(data.user.preferences?.nativeLanguage || '')
        setTargetLanguage(data.user.preferences?.targetLanguages?.[0] || '')
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
    }
  }

  const saveLanguagePreferences = async () => {
    setSavingLanguages(true)
    setMessage('')

    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: {
            nativeLanguage,
            targetLanguages: [targetLanguage]
          }
        })
      })

      if (response.ok) {
        setMessage('Language preferences saved successfully!')
        setMessageType('success')
      } else {
        setMessage('Failed to save language preferences')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage('Error saving language preferences')
      setMessageType('error')
    } finally {
      setSavingLanguages(false)
    }
  }

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${API_URL}/api/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      } else {
        setMessage('Unable to load subscription status')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setMessage('Error loading subscription information')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your current billing period.')) {
      return
    }

    setActionLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('anylingo_token')
      const endpoint = subscription?.isTrialActive ? '/cancel-trial' : '/cancel'
      
      const response = await fetch(`${API_URL}/api/subscriptions${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setMessage('Subscription cancelled successfully')
        setMessageType('success')
        await fetchSubscriptionStatus() // Refresh status
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to cancel subscription')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      setMessage('Error cancelling subscription')
      setMessageType('error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpgradeToAnnual = async () => {
    if (!confirm('Upgrade to annual plan and save 30%? You will be charged immediately for the annual subscription.')) {
      return
    }

    setActionLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('anylingo_token')
      const response = await fetch(`${API_URL}/api/subscriptions/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planType: 'annual'
        })
      })

      if (response.ok) {
        setMessage('Successfully upgraded to annual plan!')
        setMessageType('success')
        await fetchSubscriptionStatus() // Refresh status
      } else {
        const data = await response.json()
        setMessage(data.error || 'Failed to upgrade subscription')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      setMessage('Error upgrading subscription')
      setMessageType('error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Account Management</h2>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Language Preferences Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Language Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Native Language
            </label>
            <select
              id="nativeLanguage"
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">
              Target Language (Learning)
            </label>
            <select
              id="targetLanguage"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your target language</option>
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

          <button
            onClick={saveLanguagePreferences}
            disabled={savingLanguages}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            {savingLanguages ? 'Saving...' : 'Save Language Preferences'}
          </button>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Subscription Status</h3>
        
        {subscription ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className={`text-lg font-semibold ${
                  subscription.status === 'active' ? 'text-green-600' :
                  subscription.status === 'trial' ? 'text-blue-600' :
                  subscription.status === 'lifetime' ? 'text-purple-600' :
                  'text-gray-600'
                }`}>
                  {subscription.status === 'active' ? '✅ Active' :
                   subscription.status === 'trial' ? '🆓 Free Trial' :
                   subscription.status === 'lifetime' ? '♾️ Lifetime Access' :
                   subscription.status}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Plan</label>
                <p className="text-lg font-semibold text-gray-900">
                  {subscription.plan === 'monthly' ? 'Monthly ($2.99/month)' :
                   subscription.plan === 'annual' ? 'Annual ($24.99/year)' :
                   subscription.plan === 'lifetime' ? 'Lifetime Access' :
                   subscription.plan}
                </p>
              </div>
            </div>

            {subscription.trialEndDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Trial Ends</label>
                <p className="text-lg text-gray-900">
                  {new Date(subscription.trialEndDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {subscription.nextBillingDate && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Next Billing Date</label>
                <p className="text-lg text-gray-900">
                  {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No active subscription found</p>
        )}
      </div>

      {/* Action Buttons */}
      {subscription && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Manage Subscription</h3>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Upgrade to Annual (only show for monthly subscribers) */}
            {subscription.canUpgrade && subscription.plan === 'monthly' && (
              <button
                onClick={handleUpgradeToAnnual}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {actionLoading ? 'Processing...' : '⬆️ Upgrade to Annual (Save 30%)'}
              </button>
            )}

            {/* Cancel Subscription */}
            {subscription.canCancel && (
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              >
                {actionLoading ? 'Processing...' : '❌ Cancel Subscription'}
              </button>
            )}
          </div>

          {subscription.status === 'lifetime' && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800 font-medium">
                🎉 You have lifetime access to AnyLingo! No further payments required.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 