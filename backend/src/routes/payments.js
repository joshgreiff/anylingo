const express = require('express');
const auth = require('../middleware/auth');
const squareService = require('../services/squareService');
const router = express.Router();

// Create payment
router.post('/create', auth, async (req, res) => {
    try {
        const { amount, currency = 'USD', sourceId } = req.body;

        const payment = await squareService.createPayment(
            amount,
            currency,
            sourceId,
            req.user.subscription.squareCustomerId
        );

        res.json({
            message: 'Payment created successfully',
            payment
        });
    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ error: 'Failed to create payment' });
    }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
    try {
        // This would typically fetch from a payments collection
        // For now, return empty array
        res.json({
            payments: [],
            total: 0
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ error: 'Failed to get payment history' });
    }
});

// Get payment status
router.get('/:paymentId/status', auth, async (req, res) => {
    try {
        // This would fetch payment status from Square
        res.json({
            paymentId: req.params.paymentId,
            status: 'unknown'
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Failed to get payment status' });
    }
});

module.exports = router; 