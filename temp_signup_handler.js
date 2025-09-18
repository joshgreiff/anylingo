  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const formData = new FormData(e.currentTarget)
      const fullName = formData.get('fullName') as string
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || nameParts[0]
      
      const userData = {
        firstName,
        lastName,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        preferences: {
          targetLanguages: [formData.get('targetLanguage') as string]
        },
        promoCode: formData.get('promoCode') as string
      }

      // Store user data locally instead of creating account
      localStorage.setItem('anylingo_pending_user', JSON.stringify(userData))
      
      setMessage('Information saved! Redirecting to payment...')
      setMessageType('success')
      
      // Always redirect to payment (no promo code bypass)
      setTimeout(() => {
        router.push('/payment')
      }, 1500)
      
    } catch (error) {
      setMessage('Error saving information. Please try again.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }
