// AnyLingo Signup Page JavaScript

const API_URL = 'https://anylingobackend.vercel.app';

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const promoCodeInput = document.getElementById('promoCode');
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    // Promo code validation
    if (promoCodeInput) {
        promoCodeInput.addEventListener('blur', validatePromoCode);
    }

    // Form validation
    function validateForm(formData) {
        const errors = [];

        // Name validation
        const fullName = formData.get('fullName').trim();
        if (fullName.length < 2) {
            errors.push('Full name must be at least 2 characters long');
        }

        // Email validation
        const email = formData.get('email').trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Please enter a valid email address');
        }

        // Password validation
        const password = formData.get('password');
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        // Target language validation
        const targetLanguage = formData.get('targetLanguage');
        if (!targetLanguage) {
            errors.push('Please select a target language');
        }

        // Terms validation
        const terms = formData.get('terms');
        if (!terms) {
            errors.push('You must agree to the Terms of Service and Privacy Policy');
        }

        return errors;
    }

    // Validate promo code
    async function validatePromoCode() {
        const promoCode = promoCodeInput.value.trim();
        
        if (!promoCode) {
            clearPromoCodeMessage();
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/subscriptions/validate-promo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ promoCode })
            });

            const data = await response.json();

            if (response.ok && data.valid) {
                showPromoCodeMessage('success', `Valid promo code! ${data.description}`);
            } else {
                showPromoCodeMessage('error', data.error || 'Invalid promo code');
            }
        } catch (error) {
            console.error('Promo code validation error:', error);
            showPromoCodeMessage('error', 'Failed to validate promo code');
        }
    }

    // Show promo code message
    function showPromoCodeMessage(type, message) {
        clearPromoCodeMessage();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `text-sm mt-1 ${type === 'success' ? 'text-green-600' : 'text-red-600'}`;
        messageDiv.textContent = message;
        
        promoCodeInput.parentNode.appendChild(messageDiv);
    }

    // Clear promo code message
    function clearPromoCodeMessage() {
        const existingMessage = promoCodeInput.parentNode.querySelector('.text-sm.mt-1');
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // Handle signup form submission
    async function handleSignup(e) {
        e.preventDefault();

        const formData = new FormData(signupForm);
        const errors = validateForm(formData);

        if (errors.length > 0) {
            showErrors(errors);
            return;
        }

        // Show loading state
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        try {
            // Create account
            const userData = await createAccount(formData);
            
            // If promo code is provided, apply it
            const promoCode = formData.get('promoCode').trim();
            if (promoCode) {
                await applyPromoCode(userData.token, promoCode);
                showSuccess('Account created successfully! Promo code applied. Redirecting to app...');
                
                // Store token and redirect to app
                localStorage.setItem('anylingo_token', userData.token);
                setTimeout(() => {
                    window.location.href = '../app/';
                }, 2000);
            } else {
                showSuccess('Account created successfully! Redirecting to payment...');
                
                // Store user data and redirect to payment
                localStorage.setItem('anylingo_token', userData.token);
                localStorage.setItem('anylingo_user_data', JSON.stringify({
                    fullName: formData.get('fullName'),
                    email: formData.get('email'),
                    targetLanguage: formData.get('targetLanguage'),
                    marketing: formData.get('marketing') === 'on'
                }));
                
                setTimeout(() => {
                    window.location.href = 'payment.html';
                }, 2000);
            }

        } catch (error) {
            showError(error.message || 'Failed to create account. Please try again.');
            console.error('Signup error:', error);
        } finally {
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    // Create account API call
    async function createAccount(formData) {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName: formData.get('fullName').split(' ')[0],
                lastName: formData.get('fullName').split(' ').slice(1).join(' ') || '',
                email: formData.get('email'),
                password: formData.get('password'),
                preferences: {
                    targetLanguages: [formData.get('targetLanguage')]
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create account');
        }

        return data;
    }

    // Apply promo code API call
    async function applyPromoCode(token, promoCode) {
        const response = await fetch(`${API_URL}/api/subscriptions/apply-promo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ promoCode })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to apply promo code');
        }

        return data;
    }

    // Show validation errors
    function showErrors(errors) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mb-6';
        
        const errorList = document.createElement('ul');
        errorList.className = 'text-red-700 space-y-1';
        
        errors.forEach(error => {
            const errorItem = document.createElement('li');
            errorItem.textContent = `• ${error}`;
            errorList.appendChild(errorItem);
        });
        
        errorContainer.appendChild(errorList);
        
        // Insert at the top of the form
        signupForm.insertBefore(errorContainer, signupForm.firstChild);
        
        // Scroll to errors
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Show success message
    function showSuccess(message) {
        const successContainer = document.createElement('div');
        successContainer.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
        successContainer.textContent = message;
        
        document.body.appendChild(successContainer);
        
        setTimeout(() => {
            successContainer.remove();
        }, 5000);
    }

    // Show error message
    function showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
        errorContainer.textContent = message;
        
        document.body.appendChild(errorContainer);
        
        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
    }

    // Real-time password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updatePasswordStrengthIndicator(strength);
        });
    }

    // Calculate password strength
    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        return score;
    }

    // Update password strength indicator
    function updatePasswordStrengthIndicator(strength) {
        let strengthText = '';
        let strengthColor = '';
        
        switch(strength) {
            case 0:
            case 1:
                strengthText = 'Very Weak';
                strengthColor = 'text-red-600';
                break;
            case 2:
                strengthText = 'Weak';
                strengthColor = 'text-orange-600';
                break;
            case 3:
                strengthText = 'Fair';
                strengthColor = 'text-yellow-600';
                break;
            case 4:
                strengthText = 'Good';
                strengthColor = 'text-blue-600';
                break;
            case 5:
                strengthText = 'Strong';
                strengthColor = 'text-green-600';
                break;
        }
        
        // Update or create strength indicator
        let strengthIndicator = document.getElementById('password-strength');
        if (!strengthIndicator) {
            strengthIndicator = document.createElement('p');
            strengthIndicator.id = 'password-strength';
            strengthIndicator.className = 'text-sm mt-1';
            passwordInput.parentNode.appendChild(strengthIndicator);
        }
        
        strengthIndicator.textContent = `Password strength: ${strengthText}`;
        strengthIndicator.className = `text-sm mt-1 ${strengthColor}`;
    }

    // Auto-save form data
    const formInputs = signupForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
        // Load saved data
        const savedValue = localStorage.getItem(`anylingo_signup_${input.name}`);
        if (savedValue && input.type !== 'password') {
            input.value = savedValue;
        }
        
        // Save data on input
        input.addEventListener('input', function() {
            if (this.type !== 'password') {
                localStorage.setItem(`anylingo_signup_${this.name}`, this.value);
            }
        });
    });

    // Clear saved data on successful signup
    function clearSavedFormData() {
        formInputs.forEach(input => {
            localStorage.removeItem(`anylingo_signup_${input.name}`);
        });
    }
}); 