'use client'

import { useState } from 'react'

export default function PaymentPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">AnyLingo™</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 mt-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AnyLingo!</h2>
          <p className="text-lg text-gray-600">Choose your subscription plan to start your language learning journey.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className={`bg-white rounded-lg shadow-lg p-8 border-2 transition-colors cursor-pointer ${
            selectedPlan === 'monthly' ? 'border-blue-500' : 'border-gray-200 hover:border-blue-500'
          }`} onClick={() => setSelectedPlan('monthly')}>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly Plan</h3>
              <div className="text-4xl font-bold text-blue-600 mb-4">$2.99<span className="text-lg text-gray-500">/month</span></div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors">
                Choose Monthly Plan
              </button>
            </div>
          </div>

          <div className={`bg-white rounded-lg shadow-lg p-8 border-2 relative transition-colors cursor-pointer ${
            selectedPlan === 'annual' ? 'border-green-500' : 'border-green-500 hover:border-green-600'
          }`} onClick={() => setSelectedPlan('annual')}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">Save 30%</span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual Plan</h3>
              <div className="text-4xl font-bold text-green-600 mb-2">$24.99<span className="text-lg text-gray-500">/year</span></div>
              <div className="text-sm text-gray-500 mb-4">$2.08/month - Save $10.89!</div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-colors">
                Choose Annual Plan
              </button>
            </div>
          </div>
        </div>

        {selectedPlan && (
          <div className="text-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-lg font-semibold text-lg transition-colors">
              Complete Payment - {selectedPlan === 'monthly' ? '$2.99' : '$24.99'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
