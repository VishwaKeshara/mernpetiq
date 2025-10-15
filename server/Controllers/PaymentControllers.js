import '../loadEnv.js';
import mongoose from "mongoose";
import Stripe from "stripe";
import { Card, Tx } from "../Model/PaymentModel.js";
import AppointmentModel from '../Model/AppointmentModel.js';
import { getNextRef } from "../utils/ref.js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY must be defined in environment variables');
}
const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

let CACHED_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID || null;

// Configure your LKR → USD exchange rate here (or via env)
const FX_LKR_PER_USD = Number(process.env.FX_LKR_PER_USD || 300); // 1 USD ≈ 300 LKR as example

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
      customer,
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

// Get all saved payment methods (cards)
export const getPaymentMethods = async (req, res) => {
  try {
    const customer = await getOrCreateDemoCustomer();

    const paymentMethods = await stripe.paymentMethods.list({
      customer,
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

    const card = await Card.findOneAndUpdate(
      { pmId },
      {
        pmId,
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        exp_month: paymentMethod.card.exp_month,
        exp_year: paymentMethod.card.exp_year,
        billing_name: paymentMethod.billing_details?.name || "",
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

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const { pmId } = req.params;

    try {
      await stripe.paymentMethods.detach(pmId);
    } catch (err) {
      console.error('Stripe detach failed (continuing):', err);
    }

    await Card.findOneAndDelete({ pmId });
    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
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
    const updateData = {};
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

/**
 * CREATE PAYMENT INTENT
 * - Frontend sends amount_lkr (integer rupees). We DISPLAY in LKR but CHARGE in USD.
 * - We convert LKR → USD cents using FX_LKR_PER_USD.
 * - We enforce Stripe's minimum of $0.50 (50 cents).
 * - We store both USD cents (for Stripe reconciliation) and LKR (for UI/admin display).
 * - For appointments (source='hospital'), generate a pretty APPT reference for display.
 * - For mart (source='mart'), auto-generate a pretty MART reference if missing.
 */
export const createPaymentIntent = async (req, res) => {
  try {
    let {
      amount,
      amount_lkr,
      payment_method,
      source,
      ref_id,
      description,
      currency
    } = req.body;

    // Normalize incoming LKR amount
    if (amount_lkr == null) {
      if (currency && String(currency).toLowerCase() === 'lkr' && amount != null) {
        amount_lkr = Math.round(Number(amount));
      }
    }

    if (amount_lkr == null) {
      return res.status(400).json({
        error: "amount_lkr is required (integer rupees)."
      });
    }

    amount_lkr = Math.round(Number(amount_lkr));
    if (!Number.isFinite(amount_lkr) || amount_lkr < 1) {
      return res.status(400).json({
        error: "amount_lkr must be a valid integer >= 1",
        received: amount_lkr
      });
    }

    // Normalize/derive source
    let src = (source || '').toString().trim().toLowerCase();
    if (src !== 'hospital' && src !== 'mart') {
      const desc = (description || '').toString().toLowerCase();
      if (desc.includes('mart')) src = 'mart';
      else if (desc.includes('hospital')) src = 'hospital';
      else src = 'unknown';
    }

    // Hospital (appointments): keep original appointmentId for internal updates, generate pretty APPT ref for display
    let appointmentId = null;
    let apptPrettyRef = null;
    if (src === 'hospital') {
      appointmentId = (ref_id && String(ref_id).trim()) ? String(ref_id).trim() : null;
      apptPrettyRef = await getNextRef('APPT'); // APPT-000001
    }

    // Mart (product): if no ref provided, generate pretty MART ref for display/storage
    let martPrettyRef = null;
    if (src === 'mart') {
      const incomingRef = (ref_id && String(ref_id).trim()) ? String(ref_id).trim() : null;
      if (!incomingRef) {
        martPrettyRef = await getNextRef('MART'); // MART-000001
      }
    }

    // Convert LKR → USD cents (Stripe charges USD)
    const amount_usd_cents = Math.round((amount_lkr / FX_LKR_PER_USD) * 100);

    // Enforce Stripe minimum of 50 cents
    const minLkr = Math.ceil(0.5 * FX_LKR_PER_USD);
    if (amount_usd_cents < 50) {
      return res.status(400).json({
        error: `Minimum charge is $0.50 (≈ LKR ${minLkr}). Increase the amount.`,
        received_lkr: amount_lkr,
        rate_lkr_per_usd: FX_LKR_PER_USD
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        error: "Payment method is required",
        received: { payment_method }
      });
    }

    const customer = await getOrCreateDemoCustomer();

    // Validate / attach payment method
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
    } catch (err) {
      console.error('Payment method validation error:', err);
      return res.status(400).json({
        error: "Invalid payment method",
        details: err.message
      });
    }

    // Decide metadata ref values per normalized source
    const incomingRef = (ref_id && String(ref_id).trim()) ? String(ref_id).trim() : '';
    const metaRefId =
      src === 'hospital'
        ? (appointmentId || incomingRef)
        : (src === 'mart' ? (martPrettyRef || incomingRef) : incomingRef);

    const metaPrettyRef =
      src === 'hospital'
        ? (apptPrettyRef || '')
        : (src === 'mart' ? (martPrettyRef || '') : '');

    // Create the PaymentIntent in USD
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_usd_cents,     // cents
      currency: 'usd',              // force USD
      customer,
      payment_method,
      confirm: true,
      off_session: true,
      description: description || (src === 'mart' ? 'Mart purchase payment' : 'Hospital appointment payment'),
      metadata: {
        source: src, // normalized
        ref_id: metaRefId,
        pretty_ref: metaPrettyRef,
        original_amount_lkr: String(amount_lkr),
        display_currency: 'lkr',
        exchange_rate_lkr_per_usd: String(FX_LKR_PER_USD)
      },
      confirmation_method: 'automatic'
    });

    // Determine display/store reference
    const displayRef = apptPrettyRef || martPrettyRef || incomingRef || '';

    // Save transaction
    await Tx.create({
      piId: paymentIntent.id,
      amount: paymentIntent.amount,               // USD cents
      currency: paymentIntent.currency,           // 'usd'
      status: paymentIntent.status,
      source: src,                                 // normalized
      ref_id: displayRef,                          // pretty APPT/MART ref (or incoming ref)
      description: description || (src === 'mart' ? 'Mart purchase payment' : 'Hospital appointment payment'),
      stripe_customer: customer,
      payment_method,
      metadata: paymentIntent.metadata,

      // LKR reporting
      amount_lkr: amount_lkr,
      exchange_rate_lkr_per_usd: FX_LKR_PER_USD,
      display_currency: 'lkr'
    });

    if (paymentIntent.status === 'succeeded') {
      if (src === 'hospital' && appointmentId) {
        await AppointmentModel.findByIdAndUpdate(
          appointmentId,
          {
            paymentStatus: 'completed',
            paymentIntentId: paymentIntent.id,
            updatedAt: new Date()
          }
        );
      }
      return res.json({
        success: true,
        amount: paymentIntent.amount,              // USD cents
        currency: paymentIntent.currency,          // 'usd'
        amount_lkr: amount_lkr,
        display_currency: 'lkr',
        exchange_rate_lkr_per_usd: FX_LKR_PER_USD,
        id: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        ref_id: displayRef || null
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

// ADMIN: Get all payments
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
        await Tx.findOneAndUpdate(
          { piId: paymentIntent.id },
          { status: paymentIntent.status }
        );
        if (paymentIntent.metadata?.source === 'hospital' && paymentIntent.metadata?.ref_id) {
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
        if (failedPayment.metadata?.source === 'hospital' && failedPayment.metadata?.ref_id) {
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
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};