// AnyLingo Payment Page JavaScript

const API_URL = 'https://anylingo-production.up.railway.app';

// Square configuration - these should be set in your Square Developer Dashboard
// For now, using placeholder values that need to be replaced with actual values
const SQUARE_APPLICATION_ID = 'sandbox-sq0idb-your-app-id-here'; // Replace with actual Square App ID
const SQUARE_LOCATION_ID = 'your-location-id-here'; // Replace with actual Square Location ID

let selectedPlan = null;
let card = null;
let payments = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const token = localStorage.getItem('anylingo_token');
    if (!token) {
        // Redirect to signup if no token
        window.location.href = '/signup.html';
        return;
    }

    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('anylingo_user_data') || '{}');
    if (userData.email) {
        document.getElementById('userEmail').textContent = userData.email;
    }

    // Initialize Square
    initializeSquare();

    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Plan selection buttons
    document.getElementById('monthlyBtn').addEventListener('click', () => selectPlan('monthly'));
    document.getElementById('annualBtn').addEventListener('click', () => selectPlan('annual'));
    
    // Payment form buttons
    document.getElementById('payButton').addEventListener('click', processPayment);
    document.getElementById('backButton').addEventListener('click', goBackToPlans);
}

function selectPlan(planType) {
    selectedPlan = planType;
    
    // Hide pricing cards and show payment form
    document.querySelector('.grid').style.display = 'none';
    document.getElementById('paymentForm').classList.remove('hidden');
    
    // Update payment summary
    updatePaymentSummary(planType);
    
    // Initialize Square card form
    initializeCardForm();
}

function updatePaymentSummary(planType) {
    const planName = planType === 'monthly' ? 'Monthly Plan' : 'Annual Plan';
    const planPrice = planType === 'monthly' ? '$2.99' : '$24.99';
    
    document.getElementById('planName').textContent = planName;
    document.getElementById('planPrice').textContent = planPrice;
    document.getElementById('totalPrice').textContent = planPrice;
}

function goBackToPlans() {
    // Show pricing cards and hide payment form
    document.querySelector('.grid').style.display = 'grid';
    document.getElementById('paymentForm').classList.add('hidden');
    selectedPlan = null;
}

async function initializeSquare() {
    try {
        // Check if Square is available
        if (typeof Square === 'undefined') {
            throw new Error('Square SDK not loaded');
        }

        // Initialize Square Payments
        payments = Square.payments(SQUARE_APPLICATION_ID, SQUARE_LOCATION_ID);
        console.log('Square initialized successfully');
    } catch (error) {
        console.error('Error initializing Square:', error);
        showError('Payment system is currently unavailable. Please try again later or contact support.');
    }
}

async function initializeCardForm() {
    try {
        if (!payments) {
            throw new Error('Square payments not initialized');
        }

        // Create card payment method
        card = await payments.card();
        await card.attach('#card-container');
        
        console.log('Card form initialized');
    } catch (error) {
        console.error('Error initializing card form:', error);
        showError('Failed to load payment form. Please refresh the page.');
    }
}

async function processPayment() {
    if (!selectedPlan || !card) {
        showError('Please select a plan and ensure payment form is loaded.');
        return;
    }

    const payButton = document.getElementById('payButton');
    const originalText = payButton.textContent;
    
    // Show loading state
    payButton.disabled = true;
    payButton.textContent = 'Processing...';
    hideError();

    try {
        // Tokenize the card
        const result = await card.tokenize();
        
        if (result.status === 'OK') {
            // Create subscription on backend
            await createSubscription(selectedPlan, result.token);
        } else {
            throw new Error(result.errors[0].detail || 'Card tokenization failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError(error.message || 'Payment failed. Please try again.');
        
        // Reset button
        payButton.disabled = false;
        payButton.textContent = originalText;
    }
}

async function createSubscription(planType, cardToken) {
    try {
        const token = localStorage.getItem('anylingo_token');
        
        const response = await fetch(`${API_URL}/api/subscriptions/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                planType: planType,
                cardToken: cardToken
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Payment successful
            showSuccess();
            
            // Redirect to app after 3 seconds
            setTimeout(() => {
                window.location.href = '/app/';
            }, 3000);
        } else {
            throw new Error(data.error || 'Failed to create subscription');
        }
    } catch (error) {
        console.error('Subscription creation error:', error);
        throw error;
    }
}

function showSuccess() {
    // Hide payment form and show success state
    document.getElementById('paymentForm').classList.add('hidden');
    document.getElementById('successState').classList.remove('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

// Handle page visibility change (in case user switches tabs during payment)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && selectedPlan && !card) {
        // Re-initialize card form if needed
        initializeCardForm();
    }
});
