// AnyLingo Signup Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
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
            // Simulate API call
            await createAccount(formData);
            
            // Show success and redirect to payment
            showSuccess('Account created successfully! Redirecting to payment...');
            
            // Store user data temporarily (in real app, this would be in backend)
            const userData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                targetLanguage: formData.get('targetLanguage'),
                marketing: formData.get('marketing') === 'on'
            };
            
            localStorage.setItem('anylingo_user_data', JSON.stringify(userData));
            
            // Redirect to payment page
            setTimeout(() => {
                window.location.href = 'payment.html';
            }, 2000);

        } catch (error) {
            showError('Failed to create account. Please try again.');
            console.error('Signup error:', error);
        } finally {
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    // Simulate account creation API call
    async function createAccount(formData) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Simulate 95% success rate
                if (Math.random() > 0.05) {
                    resolve({
                        success: true,
                        userId: 'user_' + Date.now(),
                        message: 'Account created successfully'
                    });
                } else {
                    reject(new Error('Network error'));
                }
            }, 1500);
        });
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

    // Add form data clearing to successful signup
    const originalHandleSignup = handleSignup;
    handleSignup = async function(e) {
        await originalHandleSignup(e);
        clearSavedFormData();
    };
}); 