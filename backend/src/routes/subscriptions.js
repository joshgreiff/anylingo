const express = require('express');
const auth = require('../middleware/auth');
const squareService = require('../services/squareService');
const trialManager = require('../services/trialManager');
const User = require('../models/User');
const router = express.Router();

// Get Square configuration for frontend
router.get('/square-config', (req, res) => {
    try {
        const environment = process.env.SQUARE_ENVIORNMENT || process.env.SQUARE_ENVIRONMENT || 'sandbox';
        
        // Debug logging
        console.log('Square Config Debug:');
        console.log('SQUARE_ENVIORNMENT:', process.env.SQUARE_ENVIORNMENT);
        console.log('SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT);
        console.log('Final environment:', environment);
        
        // Return only the public Square configuration needed for Web Payments SDK
        res.json({
            applicationId: process.env.SQUARE_APPLICATION_ID || "sandbox-sq0idb-PLACEHOLDER",
            locationId: process.env.SQUARE_LOCATION_ID,
            environment: environment
        });
    } catch (error) {
        console.error('Error getting Square config:', error);
        res.status(500).json({ error: 'Failed to get payment configuration' });
    }
});

// Helper function to convert trial to paid subscription
async function convertTrialToSubscription(user) {
    try {
        // Create the actual Square subscription
        const subscription = await squareService.createSubscriptionWithDelay(
            user.subscription.squareCustomerId,
            user.subscription.squareCardId,
            user.subscription.plan,
            new Date().toISOString().split('T')[0]
        );

        // Update user subscription status
        user.subscription.status = 'active';
        user.subscription.squareSubscriptionId = subscription.id;
        user.subscription.startDate = new Date();
        
        // Set next billing date based on plan
        const nextBillingDate = new Date();
        if (user.subscription.plan === 'annual') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }
        user.subscription.endDate = nextBillingDate;

        await user.save();
        
        console.log(`Converted trial to paid subscription for user: ${user.email}`);
        return subscription;
    } catch (error) {
        console.error('Error converting trial to subscription:', error);
        // Mark subscription as failed and notify user
        user.subscription.status = 'payment_failed';
        await user.save();
        throw error;
    }
}

// Promo codes for testing
const PROMO_CODES = {
    'TESTING2025': {
        type: 'lifetime',
        description: 'Free lifetime access for testing',
        valid: true
    },
    'FOUNDER2025': {
        type: 'lifetime', 
        description: 'Founder access',
        valid: true
    }
};

// Validate promo code
router.post('/validate-promo', async (req, res) => {
    try {
        const { promoCode } = req.body;
        
        if (!promoCode) {
            return res.status(400).json({ error: 'Promo code is required' });
        }

        const code = PROMO_CODES[promoCode.toUpperCase()];
        
        if (!code || !code.valid) {
            return res.status(400).json({ error: 'Invalid promo code' });
        }

        res.json({
            valid: true,
            type: code.type,
            description: code.description
        });

    } catch (error) {
        console.error('Validate promo code error:', error);
        res.status(500).json({ error: 'Failed to validate promo code' });
    }
});

// Create free trial with payment method
router.post('/create-trial', auth, async (req, res) => {
    try {
        console.log('Create trial request received');
        console.log('Request user:', req.user ? req.user._id : 'No user');
        console.log('Request userId:', req.userId || 'No userId');
        
        const { planType, cardToken, trialDays = 7 } = req.body;
        const user = req.user; // User is already loaded by auth middleware
        
        console.log('User found:', user ? user._id : 'No user found');
        
        if (!user) {
            console.log('Returning 404 - User not found');
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user already has an active subscription or trial
        if (user.subscription.status === 'active' || user.subscription.status === 'trial') {
            return res.status(400).json({ error: 'User already has an active subscription' });
        }

        // Create or get Square customer
        let squareCustomer;
        if (user.subscription.squareCustomerId) {
            squareCustomer = await squareService.getCustomer(user.subscription.squareCustomerId);
        } else {
            squareCustomer = await squareService.createCustomer(user);
            user.subscription.squareCustomerId = squareCustomer.id;
        }

        // Create and store the payment method (card) for future use
        const card = await squareService.createCard(squareCustomer.id, cardToken);

        // Calculate trial end date
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        // Update user subscription to trial status
        user.subscription = {
            ...user.subscription,
            status: 'trial',
            plan: planType,
            startDate: new Date(),
            endDate: trialEndDate,
            trialEndDate: trialEndDate,
            squareCustomerId: squareCustomer.id,
            squareCardId: card.id,
            autoRenew: true,
            paymentMethod: 'square'
        };

        await user.save();

        // The trialManager will automatically check for expired trials every hour
        // No need for setTimeout - this is handled by the cron job

        res.json({
            message: 'Free trial started successfully',
            trialEndDate: trialEndDate,
            plan: planType,
            daysRemaining: trialDays
        });

    } catch (error) {
        console.error('Create trial error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            squareError: error.errors ? error.errors : null
        });
        res.status(500).json({ 
            error: 'Failed to start free trial',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Apply promo code to user
router.post('/apply-promo', auth, async (req, res) => {
    try {
        const { promoCode } = req.body;
        const user = req.user;

        if (!promoCode) {
            return res.status(400).json({ error: 'Promo code is required' });
        }

        const code = PROMO_CODES[promoCode.toUpperCase()];
        
        if (!code || !code.valid) {
            return res.status(400).json({ error: 'Invalid promo code' });
        }

        // Check if user already has an active subscription
        if (user.hasActiveSubscription()) {
            return res.status(400).json({ error: 'User already has an active subscription' });
        }

        // Apply promo code benefits
        if (code.type === 'lifetime') {
            user.subscription = {
                status: 'lifetime',
                startDate: new Date(),
                endDate: null, // Lifetime access
                promoCode: promoCode.toUpperCase(),
                autoRenew: false
            };
        }

        await user.save();

        res.json({
            message: 'Promo code applied successfully',
            subscription: user.subscription,
            type: code.type,
            description: code.description
        });

    } catch (error) {
        console.error('Apply promo code error:', error);
        res.status(500).json({ error: 'Failed to apply promo code' });
    }
});

// Get subscription plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await squareService.getSubscriptionPlans();
        res.json({ plans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Failed to get subscription plans' });
    }
});

// Create subscription
router.post('/create', auth, async (req, res) => {
    try {
        const { planType, cardToken } = req.body;
        const user = req.user;

        // Check if user already has an active subscription
        if (user.hasActiveSubscription()) {
            return res.status(400).json({ error: 'User already has an active subscription' });
        }

        // Create or get Square customer
        let squareCustomer;
        if (user.subscription.squareCustomerId) {
            squareCustomer = await squareService.getCustomer(user.subscription.squareCustomerId);
        } else {
            squareCustomer = await squareService.createCustomer(user);
            user.subscription.squareCustomerId = squareCustomer.id;
        }

        // Create Square subscription
        const squareSubscription = await squareService.createSubscription(
            squareCustomer.id,
            planType
        );

        // Update user subscription
        const startDate = new Date();
        const endDate = new Date();
        
        if (planType === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (planType === 'annual') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        user.subscription = {
            status: planType,
            startDate,
            endDate,
            squareCustomerId: squareCustomer.id,
            squareSubscriptionId: squareSubscription.id,
            autoRenew: true
        };

        await user.save();

        res.json({
            message: 'Subscription created successfully',
            subscription: user.subscription
        });

    } catch (error) {
        console.error('Create subscription error:', error);
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});

// Cancel trial before it converts to paid subscription
router.post('/cancel-trial', auth, async (req, res) => {
    try {
        await trialManager.cancelTrial(req.userId);

        res.json({
            message: 'Trial cancelled successfully',
            status: 'cancelled'
        });

    } catch (error) {
        console.error('Cancel trial error:', error);
        res.status(500).json({ error: error.message || 'Failed to cancel trial' });
    }
});

// Get trial status
router.get('/trial-status', auth, async (req, res) => {
    try {
        const trialStatus = await trialManager.checkUserTrialStatus(req.userId);
        
        if (!trialStatus) {
            return res.status(404).json({ error: 'No active trial found' });
        }

        res.json(trialStatus);

    } catch (error) {
        console.error('Get trial status error:', error);
        res.status(500).json({ error: 'Failed to get trial status' });
    }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
    try {
        const user = req.user;

        if (!user.hasActiveSubscription()) {
            return res.status(400).json({ error: 'No active subscription to cancel' });
        }

        // Cancel Square subscription
        if (user.subscription.squareSubscriptionId) {
            await squareService.cancelSubscription(user.subscription.squareSubscriptionId);
        }

        // Update user subscription
        user.subscription.autoRenew = false;
        await user.save();

        res.json({
            message: 'Subscription cancelled successfully',
            subscription: user.subscription
        });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// Get subscription status
router.get('/status', auth, async (req, res) => {
    try {
        const user = req.user;
        
        let squareSubscription = null;
        if (user.subscription.squareSubscriptionId) {
            try {
                squareSubscription = await squareService.getSubscription(user.subscription.squareSubscriptionId);
            } catch (error) {
                console.error('Error fetching Square subscription:', error);
            }
        }

        // Format response for frontend
        const status = user.subscription.status || 'free';
        const plan = user.subscription.status === 'trial' ? 'trial' : 
                     user.subscription.status === 'monthly' ? 'monthly' :
                     user.subscription.status === 'annual' ? 'annual' :
                     user.subscription.status === 'free' ? 'free' : 'free';
        
        const isTrialActive = status === 'trial' && user.subscription.endDate && new Date(user.subscription.endDate) > new Date();
        
        res.json({
            status,
            plan,
            nextBillingDate: user.subscription.endDate,
            trialEndDate: isTrialActive ? user.subscription.endDate : null,
            isTrialActive,
            canCancel: status === 'monthly' || status === 'annual' || status === 'trial',
            canUpgrade: status === 'monthly'
        });

    } catch (error) {
        console.error('Get subscription status error:', error);
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
});

// Update subscription preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const { autoRenew } = req.body;
        const user = req.user;

        if (autoRenew !== undefined) {
            user.subscription.autoRenew = autoRenew;
            await user.save();
        }

        res.json({
            message: 'Subscription preferences updated',
            subscription: user.subscription
        });

    } catch (error) {
        console.error('Update subscription preferences error:', error);
        res.status(500).json({ error: 'Failed to update subscription preferences' });
    }
});

// Square webhook handler
router.post('/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;

        // Verify webhook signature (you should implement this)
        // const signature = req.headers['x-square-signature'];
        // if (!verifyWebhookSignature(signature, req.body)) {
        //     return res.status(400).json({ error: 'Invalid signature' });
        // }

        // Process webhook
        await squareService.processWebhook({ type, data });

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Get subscription history
router.get('/history', auth, async (req, res) => {
    try {
        const user = req.user;
        
        // This would typically fetch from a separate payments/transactions collection
        // For now, return basic subscription info
        const history = {
            currentSubscription: user.subscription,
            subscriptionHistory: [] // Would be populated from transactions
        };

        res.json(history);

    } catch (error) {
        console.error('Get subscription history error:', error);
        res.status(500).json({ error: 'Failed to get subscription history' });
    }
});

module.exports = router; 