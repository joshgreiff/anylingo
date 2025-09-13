const cron = require('node-cron');
const User = require('../models/User');
const squareService = require('./squareService');

class TrialManager {
    constructor() {
        // Only start cron job in production or when explicitly enabled
        if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
            this.startTrialCheckJob();
        } else {
            console.log('Trial management cron job disabled in development');
        }
    }

    // Run every hour to check for expired trials
    startTrialCheckJob() {
        // Run at minute 0 of every hour
        cron.schedule('0 * * * *', async () => {
            console.log('Checking for expired trials...');
            await this.processExpiredTrials();
        });

        console.log('Trial management cron job started');
    }

    async processExpiredTrials() {
        try {
            const now = new Date();
            
            // Find all users with expired trials that should be converted
            const expiredTrials = await User.find({
                'subscription.status': 'trial',
                'subscription.trialEndDate': { $lte: now },
                'subscription.autoRenew': true
            });

            console.log(`Found ${expiredTrials.length} expired trials to process`);

            for (const user of expiredTrials) {
                try {
                    await this.convertTrialToSubscription(user);
                    console.log(`Successfully converted trial for user: ${user.email}`);
                } catch (error) {
                    console.error(`Failed to convert trial for user ${user.email}:`, error);
                    
                    // Mark as payment failed so we can handle it
                    user.subscription.status = 'payment_failed';
                    user.subscription.failedAt = new Date();
                    await user.save();
                }
            }
        } catch (error) {
            console.error('Error processing expired trials:', error);
        }
    }

    async convertTrialToSubscription(user) {
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
            
            // TODO: Send confirmation email to user
            // await emailService.sendSubscriptionConfirmation(user);
            
            return subscription;
        } catch (error) {
            console.error('Error converting trial to subscription:', error);
            throw error;
        }
    }

    // Check trial status for a specific user
    async checkUserTrialStatus(userId) {
        try {
            const user = await User.findById(userId);
            if (!user || user.subscription.status !== 'trial') {
                return null;
            }

            const now = new Date();
            const trialEndDate = new Date(user.subscription.trialEndDate);
            const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));

            return {
                status: 'trial',
                daysRemaining: Math.max(0, daysRemaining),
                trialEndDate: trialEndDate,
                plan: user.subscription.plan,
                autoRenew: user.subscription.autoRenew
            };
        } catch (error) {
            console.error('Error checking trial status:', error);
            return null;
        }
    }

    // Cancel trial before it converts
    async cancelTrial(userId) {
        try {
            const user = await User.findById(userId);
            if (!user || user.subscription.status !== 'trial') {
                throw new Error('No active trial found');
            }

            user.subscription.status = 'cancelled';
            user.subscription.endDate = new Date();
            user.subscription.autoRenew = false;
            user.subscription.cancelledAt = new Date();
            
            await user.save();
            
            console.log(`Trial cancelled for user: ${user.email}`);
            return true;
        } catch (error) {
            console.error('Error cancelling trial:', error);
            throw error;
        }
    }
}

module.exports = new TrialManager(); 