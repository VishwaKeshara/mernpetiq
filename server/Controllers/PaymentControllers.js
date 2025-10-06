import '../loadEnv.js';
import mongoose from "mongoose";
import Stripe from "stripe";
import { Card, Tx } from "../Model/PaymentModel.js";
import AppointmentModel from '../Model/AppointmentModel.js';

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY must be defined in environment variables');
}
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

let CACHED_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID || null;


export async function getOrCreateDemoCustomer() {
    if (CACHED_CUSTOMER_ID) return CACHED_CUSTOMER_ID;
    const email = process.env.DEMO_CUSTOMER_EMAIL || "demo@example.com";
    try {
        const found = await stripe.customers.search({ query: `email:'${email}'` });
        if (found.data.length) {
            CACHED_CUSTOMER_ID = found.data[0].id;
            return CACHED_CUSTOMER_ID;
        }
    } catch (e) {
        console.warn("Customer search failed, will create:", e.message);
    }
    const created = await stripe.customers.create({ email, name: "VMS Demo Customer" });
    CACHED_CUSTOMER_ID = created.id;
    return CACHED_CUSTOMER_ID;
}

// Create a setup intent for saving cards
export const createSetupIntent = async (req, res) => {
    try {
        const customer = await getOrCreateDemoCustomer();
        const setupIntent = await stripe.setupIntents.create({
            customer: customer,
            usage: 'off_session',
            automatic_payment_methods: { enabled: true }
        });
        return res.json({
            clientSecret: setupIntent.client_secret,
            customerId: customer
        });
    } catch (error) {
        console.error('Setup intent creation error:', error);
        return res.status(400).json({ 
            error: error.message || 'Failed to create setup intent' 
        });
    }
};

// Get all saved payment methods (cards) for the current customer
export const getPaymentMethods = async (req, res) => {
    try {
        const customer = await getOrCreateDemoCustomer();
        
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customer,
            type: 'card'
        });

    
       for (const pm of paymentMethods.data) {
    
    const existing = await Card.findOne({ pmId: pm.id });
    if (!existing) {
        await Card.create({
            pmId: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            billing_name: pm.billing_details?.name || "",
            stripe_customer: customer,
            metadata: pm.metadata
        });
    } else {
        
        await Card.findOneAndUpdate(
            { pmId: pm.id },
            {
                brand: pm.card.brand,
                last4: pm.card.last4,
                billing_name: pm.billing_details?.name || "",
                stripe_customer: customer,
                metadata: pm.metadata
            }
        );
    }
}

        
        const cards = await Card.find({ stripe_customer: customer })
            .sort({ createdAt: -1 })
            .limit(3);

        res.json(cards);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment methods',
            error: error.message
        });
    }
};

// Get a specific payment method
export const getPaymentMethod = async (req, res) => {
    try {
        const { pmId } = req.params;
        const paymentMethod = await stripe.paymentMethods.retrieve(pmId);
        const customer = await getOrCreateDemoCustomer();

        // Save/update card in DB
        const card = await Card.findOneAndUpdate(
            { pmId },
            {
                pmId,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                exp_month: paymentMethod.card.exp_month,
                exp_year: paymentMethod.card.exp_year,
                billing_name: paymentMethod.billing_details.name,
                stripe_customer: customer,
                metadata: paymentMethod.metadata
            },
            { upsert: true, new: true }
        );

        res.json(card);
    } catch (error) {
        console.error('Error fetching payment method:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching payment method',
            error: error.message
        });
    }
};

// Delete a payment method (card)
export const deletePaymentMethod = async (req, res) => {
    try {
        const { pmId } = req.params;
    
        try {
            await stripe.paymentMethods.detach(pmId);
        } catch (err) {
            console.error('Stripe detach failed:', err); 
        }
        
        await Card.findOneAndDelete({ pmId });
        res.json({
            success: true,
            message: 'Payment method deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting payment method (outer catch):', error); 
        res.status(500).json({
            success: false,
            message: 'Error deleting payment method',
            error: error.message
        });
    }
};

// Update a payment method 
export const updatePaymentMethod = async (req, res) => {
    try {
        const { pmId } = req.params;
        const { billing_details, exp_month, exp_year } = req.body;

        
        console.log("PATCH /payment-method/:pmId", { pmId, billing_details, exp_month, exp_year });

        if (billing_details) {
            await stripe.paymentMethods.update(pmId, { billing_details });
        }
        const updateData = { };
        if (billing_details && billing_details.name)
            updateData.billing_name = billing_details.name;
        if (typeof exp_month !== "undefined") updateData.exp_month = exp_month;
        if (typeof exp_year !== "undefined") updateData.exp_year = exp_year;

        
        console.log("Update Data:", updateData);

        const card = await Card.findOneAndUpdate(
            { pmId },
            updateData,
            { upsert: true, new: true }
        );
        res.json(card);
    } catch (error) {
        console.error("ERROR in PATCH /payment-method/:pmId", error);
        res.status(500).json({
            success: false,
            message: 'Error updating payment method',
            error: error.message
        });
    }
};

// CREATE PAYMENT INTENT (charge card)
export const createPaymentIntent = async (req, res) => {
    try {
        let { amount, currency = 'usd', payment_method, source, ref_id, description } = req.body;

        // Validate amount
        if (amount === undefined || amount === null) {
            return res.status(400).json({ 
                error: "Amount is required",
                received: { amount, type: typeof amount }
            });
        }
        amount = Math.round(Number(amount));
        if (!Number.isFinite(amount) || amount < 1) {
            return res.status(400).json({ 
                error: "Amount must be a valid number greater than 0",
                received: { amount, type: typeof amount }
            });
        }
        // Validate payment method
        if (!payment_method) {
            return res.status(400).json({ 
                error: "Payment method is required",
                received: { payment_method }
            });
        }
        // Validate currency
        currency = currency.toLowerCase();
        if (!/^[a-z]{3}$/.test(currency)) {
            return res.status(400).json({ 
                error: "Invalid currency format",
                received: { currency }
            });
        }
        
        const customer = await getOrCreateDemoCustomer();

        // Validate payment method attachment
        try {
            const pm = await stripe.paymentMethods.retrieve(payment_method);
            if (!pm) {
                return res.status(400).json({ error: "Invalid payment method" });
            }
            if (!pm.customer) {
                await stripe.paymentMethods.attach(payment_method, { customer });
            } else if (pm.customer !== customer) {
                return res.status(400).json({ error: "Payment method belongs to a different customer" });
            }
        } catch (error) {
            console.error('Payment method validation error:', error);
            return res.status(400).json({ 
                error: "Invalid payment method",
                details: error.message 
            });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            customer: customer,
            payment_method: payment_method,
            confirm: true,
            off_session: true,
            description: description || 'Hospital appointment payment',
            metadata: {
                source: source || 'hospital',
                ref_id: ref_id || ''
            },
            confirmation_method: 'automatic',
        });

        // Save transaction to DB
        const tx = await Tx.create({
            piId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            source: source || 'hospital',
            ref_id: ref_id || '',
            description: description || 'Hospital appointment payment',
            stripe_customer: customer,
            payment_method: payment_method,
            metadata: paymentIntent.metadata
        });

        // Handle different payment intent statuses
        if (paymentIntent.status === 'succeeded') {
            // If this is an appointment payment, update the appointment status
            if (source === 'hospital' && ref_id) {
                await AppointmentModel.findByIdAndUpdate(
                    ref_id,
                    {
                        paymentStatus: 'completed',
                        paymentIntentId: paymentIntent.id,
                        updatedAt: new Date()
                    }
                );
            }
            return res.json({
                success: true,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                id: paymentIntent.id,
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status
            });
        } else if (paymentIntent.status === 'requires_action') {
            return res.json({
                requiresAction: true,
                clientSecret: paymentIntent.client_secret
            });
        } else {
            return res.json({
                success: false,
                status: paymentIntent.status,
                message: 'Payment requires additional handling'
            });
        }
    } catch (error) {
        console.error('Payment intent creation error:', error);
        return res.status(400).json({
            error: error.message,
            type: error.type,
            code: error.code
        });
    }
};

// ADMIN: Get all payments/transactions

export const getAllPayments = async (req, res) => {
    try {
        const filter = {};
        if (req.query.source && req.query.source !== "any") {
            filter.source = req.query.source;
        }
        if (req.query.ref) {
            filter.ref_id = { $regex: req.query.ref, $options: "i" };
        }
        if (req.query.service) {
            filter.description = { $regex: req.query.service, $options: "i" };
        }
        const transactions = await Tx.find(filter).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching all payments',
            error: error.message
        });
    }
};

// Update appointment payment status
export const updateAppointmentPaymentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { paymentIntentId, paymentStatus } = req.body;
        if (!appointmentId) {
            return res.status(400).json({
                success: false,
                message: 'Appointment ID is required'
            });
        }
        const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
            appointmentId,
            {
                paymentIntentId,
                paymentStatus,
                updatedAt: new Date()
            },
            { new: true }
        );
        if (!updatedAppointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }
        res.json({
            success: true,
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Error updating appointment payment status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating appointment payment status',
            error: error.message
        });
    }
};


export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                // Update transaction status in DB
                await Tx.findOneAndUpdate(
                    { piId: paymentIntent.id },
                    { status: paymentIntent.status }
                );
                // Update appointment status if needed
                if (paymentIntent.metadata.source === 'hospital' && paymentIntent.metadata.ref_id) {
                    await AppointmentModel.findByIdAndUpdate(
                        paymentIntent.metadata.ref_id,
                        {
                            paymentStatus: 'completed',
                            paymentIntentId: paymentIntent.id,
                            updatedAt: new Date()
                        }
                    );
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const failedPayment = event.data.object;
                await Tx.findOneAndUpdate(
                    { piId: failedPayment.id },
                    { status: failedPayment.status }
                );
                if (failedPayment.metadata.source === 'hospital' && failedPayment.metadata.ref_id) {
                    await AppointmentModel.findByIdAndUpdate(
                        failedPayment.metadata.ref_id,
                        {
                            paymentStatus: 'failed',
                            paymentIntentId: failedPayment.id,
                            updatedAt: new Date()
                        }
                    );
                }
                break;
            }
            
        }
        res.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};