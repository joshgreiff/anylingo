  const handleStartTrialWithPayment = async () => {
    if (!selectedPlan || !card || !squarePayments) {
      setError('Please enter your payment information.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const tokenResult = await squarePayments.tokenize()
      
      if (tokenResult.status === 'OK') {
        const pendingUser = localStorage.getItem('anylingo_pending_user')
        if (!pendingUser) {
          setError('Session expired. Please sign up again.')
          router.push('/signup')
          return
        }

        const userData = JSON.parse(pendingUser)
        
        // First, create the account
        const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        })

        const registerData = await registerResponse.json()

        if (!registerResponse.ok) {
          setError(registerData.message || 'Failed to create account. Please try again.')
          return
        }

        // Store auth token
        localStorage.setItem('anylingo_token', registerData.token)
        localStorage.setItem('anylingo_user_data', JSON.stringify(registerData.user))
        
        // Now start the trial
        const trialResponse = await fetch(`${API_URL}/api/subscriptions/create-trial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${registerData.token}`
          },
          body: JSON.stringify({
            planType: selectedPlan,
            cardToken: tokenResult.token,
            trialDays: 7
          })
        })

        const trialData = await trialResponse.json()

        if (trialResponse.ok) {
          // Clear pending user data
          localStorage.removeItem('anylingo_pending_user')
          
          localStorage.setItem('anylingo_trial_info', JSON.stringify({
            plan: selectedPlan,
            trialEndDate: trialData.trialEndDate,
            subscriptionId: trialData.subscriptionId
          }))
          
          router.push('/app')
        } else {
          setError(trialData.error || 'Failed to start trial. Please try again.')
        }
      } else {
        setError('Payment information is invalid. Please check your card details.')
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
