const express = require('express');
const auth = require('../middleware/auth');
const squareService = require('../services/squareService');
const User = require('../models/User');
const router = express.Router();

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

        res.json({
            subscription: user.subscription,
            squareSubscription,
            isActive: user.hasActiveSubscription()
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