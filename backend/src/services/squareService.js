const { SquareClient, SquareEnvironment } = require('square');

class SquareService {
    constructor() {
        console.log('Initializing Square client with environment:', process.env.SQUARE_ENVIRONMENT);
        console.log('Square access token present:', !!process.env.SQUARE_ACCESS_TOKEN);
        
        this.client = new SquareClient({
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            environment: process.env.SQUARE_ENVIRONMENT === 'production' 
                ? SquareEnvironment.Production 
                : SquareEnvironment.Sandbox
        });
        
        console.log('Square client created');
        console.log('Client type:', typeof this.client);
        console.log('Client keys:', Object.keys(this.client));
        console.log('Client prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)));
        console.log('customers available:', !!this.client.customers);
        
        if (this.client.customers) {
            console.log('customers type:', typeof this.client.customers);
            console.log('customers methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.client.customers)));
        }
    }

    // Create a customer
    async createCustomer(user) {
        try {
            const response = await this.client.customers.createCustomer({
                givenName: user.firstName,
                familyName: user.lastName,
                emailAddress: user.email,
                note: `AnyLingo user: ${user._id}`
            });

            return response.result.customer;
        } catch (error) {
            console.error('Error creating Square customer:', error);
            console.error('Square API error details:', error.errors);
            throw new Error('Failed to create customer');
        }
    }

    // Create a subscription with delayed start (for post-trial)
    async createSubscriptionWithDelay(customerId, cardId, planType = 'monthly', startDate) {
        try {
            const catalogResponse = await this.client.catalog.searchCatalogItems({
                productTypes: ['SUBSCRIPTION_PLAN']
            });

            // Find the appropriate subscription plan
            const plans = catalogResponse.result.items || [];
            const plan = plans.find(item => 
                item.itemData?.name?.toLowerCase().includes(planType)
            );

            if (!plan) {
                throw new Error(`Subscription plan for ${planType} not found`);
            }

            const subscriptionResponse = await this.client.subscriptions.createSubscription({
                locationId: process.env.SQUARE_LOCATION_ID,
                planId: plan.id,
                customerId: customerId,
                startDate: startDate || new Date().toISOString().split('T')[0],
                cardId: cardId,
                timezone: 'UTC'
            });

            return subscriptionResponse.result.subscription;
        } catch (error) {
            console.error('Error creating delayed Square subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }

    // Create a subscription
    async createSubscription(customerId, planType = 'monthly') {
        try {
            const catalogResponse = await this.client.catalog.searchCatalogItems({
                productTypes: ['SUBSCRIPTION_PLAN']
            });

            // Find the appropriate subscription plan
            const plans = catalogResponse.result.items || [];
            const plan = plans.find(item => 
                item.itemData?.name?.toLowerCase().includes(planType)
            );

            if (!plan) {
                throw new Error(`Subscription plan for ${planType} not found`);
            }

            const subscriptionResponse = await this.client.subscriptions.createSubscription({
                locationId: process.env.SQUARE_LOCATION_ID,
                planId: plan.id,
                customerId: customerId,
                startDate: new Date().toISOString().split('T')[0],
                cardId: null, // Will be added later via webhook or customer action
                timezone: 'UTC'
            });

            return subscriptionResponse.result.subscription;
        } catch (error) {
            console.error('Error creating Square subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }

    // Cancel a subscription
    async cancelSubscription(subscriptionId) {
        try {
            const response = await this.client.subscriptions.cancelSubscription(subscriptionId);
            return response.result.subscription;
        } catch (error) {
            console.error('Error canceling Square subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    // Get subscription details
    async getSubscription(subscriptionId) {
        try {
            const response = await this.client.subscriptions.retrieveSubscription(subscriptionId);
            return response.result.subscription;
        } catch (error) {
            console.error('Error retrieving Square subscription:', error);
            throw new Error('Failed to retrieve subscription');
        }
    }

    // Create a payment
    async createPayment(amount, currency = 'USD', sourceId, customerId = null) {
        try {
            const paymentRequest = {
                sourceId: sourceId,
                amountMoney: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: currency
                },
                locationId: process.env.SQUARE_LOCATION_ID
            };

            if (customerId) {
                paymentRequest.customerId = customerId;
            }

            const response = await this.client.payments.createPayment(paymentRequest);
            return response.result.payment;
        } catch (error) {
            console.error('Error creating Square payment:', error);
            throw new Error('Failed to create payment');
        }
    }

    // Get customer details
    async getCustomer(customerId) {
        try {
            const { customersApi } = this.client;
            const response = await customersApi.retrieveCustomer(customerId);
            return response.result.customer;
        } catch (error) {
            console.error('Error retrieving Square customer:', error);
            console.error('Square API error details:', error.errors);
            throw new Error('Failed to retrieve customer');
        }
    }

    // Update customer
    async updateCustomer(customerId, updates) {
        try {
            const response = await this.client.customers.updateCustomer(customerId, updates);
            return response.result.customer;
        } catch (error) {
            console.error('Error updating Square customer:', error);
            throw new Error('Failed to update customer');
        }
    }

    // Create a card for a customer
    async createCard(customerId, cardToken) {
        try {
            const response = await this.client.cards.createCard({
                card: {
                    customerId: customerId,
                    sourceId: cardToken
                }
            });

            return response.result.card;
        } catch (error) {
            console.error('Error creating Square card:', error);
            console.error('Square API error details:', error.errors);
            throw new Error('Failed to create card');
        }
    }

    // Get subscription plans
    async getSubscriptionPlans() {
        try {
            const response = await this.client.catalog.searchCatalogItems({
                productTypes: ['SUBSCRIPTION_PLAN']
            });

            return response.result.items || [];
        } catch (error) {
            console.error('Error retrieving Square subscription plans:', error);
            throw new Error('Failed to retrieve subscription plans');
        }
    }

    // Process webhook events
    async processWebhook(event) {
        try {
            const { type, data } = event;

            switch (type) {
                case 'subscription.updated':
                    return await this.handleSubscriptionUpdate(data);
                case 'subscription.canceled':
                    return await this.handleSubscriptionCancel(data);
                case 'payment.updated':
                    return await this.handlePaymentUpdate(data);
                default:
                    console.log(`Unhandled webhook event type: ${type}`);
                    return null;
            }
        } catch (error) {
            console.error('Error processing webhook:', error);
            throw error;
        }
    }

    // Handle subscription updates
    async handleSubscriptionUpdate(data) {
        // This would update the user's subscription status in your database
        console.log('Subscription updated:', data);
        return data;
    }

    // Handle subscription cancellations
    async handleSubscriptionCancel(data) {
        // This would update the user's subscription status in your database
        console.log('Subscription canceled:', data);
        return data;
    }

    // Handle payment updates
    async handlePaymentUpdate(data) {
        // This would update payment status in your database
        console.log('Payment updated:', data);
        return data;
    }
}

module.exports = new SquareService(); 