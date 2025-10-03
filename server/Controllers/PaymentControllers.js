import mongoose from "mongoose";
import Stripe from "stripe";
import Card from "../Model/PaymentModel.js";
import { Tx } from "../Model/PaymentModel.js";

// Initialize Stripe only if secret key is provided and valid
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeMode = process.env.STRIPE_MODE;
let stripe = null;
let isDemoMode = stripeMode === 'demo';

if (stripeSecretKey && stripeSecretKey !== 'sk_test_your_stripe_secret_key_here' && stripeSecretKey.startsWith('sk_') && !isDemoMode) {
  stripe = new Stripe(stripeSecretKey);
  console.log('✅ Stripe configured successfully');
} else if (isDemoMode) {
  console.log('🧪 Running in Stripe DEMO mode - payments will be simulated');
} else {
  console.warn('⚠️  Stripe not configured: STRIPE_SECRET_KEY missing or invalid. Payment features will be disabled.');
}

// Helper functions
const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

let CACHED_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID || null;

async function getOrCreateDemoCustomer() {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
  
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

function escapeRegex(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Order data
const ORDERS = {
  demo1: { amount_cents: 4999, currency: "usd", description: "Outpatient bill #demo1" },
  demo2: { amount_cents: 12999, currency: "usd", description: "Cart #demo2" },
  demo3: { amount_cents: 2599, currency: "usd", description: "Lab tests #demo3" },
};

// Controller functions
const getOrder = (req, res) => {
  const o = ORDERS[req.params.id];
  if (!o) return res.status(404).json({ error: "Order not found" });
  res.json(o);
};

const createSetupIntent = async (req, res) => {
  if (isDemoMode) {
    // Return mock setup intent for demo mode
    return res.json({ 
      clientSecret: "seti_demo_client_secret_" + Date.now(),
      customer: "cus_demo_customer" 
    });
  }
  
  if (!stripe) {
    return res.status(503).json({ 
      error: "Payment service not configured. Please set up Stripe API keys or enable demo mode." 
    });
  }
  
  try {
    const customer = await getOrCreateDemoCustomer();
    const si = await stripe.setupIntents.create({
      usage: "off_session",
      customer,
    });
    return res.json({ clientSecret: si.client_secret, customer });
  } catch (err) {
    console.error("create-setup-intent error:", err);
    return res.status(400).json({ error: err.message || "create-setup-intent failed" });
  }
};

const getPaymentMethod = async (req, res) => {
  if (isDemoMode) {
    // Return mock payment method for demo mode
    return res.json({
      id: req.params.pmId,
      brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2025,
      customer: "cus_demo_customer",
      billing_name: "Demo User",
    });
  }

  if (!stripe) {
    return res.status(503).json({ 
      error: "Payment service not configured. Please set up Stripe API keys or enable demo mode." 
    });
  }

  try {
    const pm = await stripe.paymentMethods.retrieve(req.params.pmId);
    if (pm && pm.card) {
      return res.json({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
        customer: pm.customer || null,
        billing_name: pm.billing_details?.name || null,
      });
    }
    return res.json(pm);
  } catch (err) {
    console.error("get payment-method error:", err);
    return res.status(400).json({ error: err.message || "retrieve payment method failed" });
  }
};

const getPaymentMethods = async (req, res) => {
  try {
    const customer = await getOrCreateDemoCustomer();
    const list = await stripe.paymentMethods.list({ customer, type: "card" });

    const cards = list.data.map((pm) => ({
      pmId: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
      billing_name: pm.billing_details?.name || null,
      stripe_customer: pm.customer || customer,
    }));

    await Promise.all(
      cards.map((c) => Card.updateOne({ pmId: c.pmId }, { $set: c }, { upsert: true }))
    );

    res.json(
      cards.map((c) => ({
        id: c.pmId,
        brand: c.brand,
        last4: c.last4,
        exp_month: c.exp_month,
        exp_year: c.exp_year,
        billing_name: c.billing_name,
      }))
    );
  } catch (err) {
    console.error("list payment-methods error:", err);
    res.status(400).json({ error: err.message || "list failed" });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    const { name, exp_month, exp_year } = req.body;

    if (!name && !exp_month && !exp_year) {
      return res.status(400).json({ error: "Provide name and/or exp_month, exp_year" });
    }

    const update = {};
    if (name) update.billing_details = { name };
    if (exp_month || exp_year) {
      update.card = {};
      if (exp_month) update.card.exp_month = Number(exp_month);
      if (exp_year) update.card.exp_year = Number(exp_year);
    }

    const pm = await stripe.paymentMethods.update(req.params.pmId, update);

    try {
      await Card.updateOne(
        { pmId: pm.id },
        {
          $set: {
            billing_name: pm.billing_details?.name || null,
            exp_month: pm.card?.exp_month,
            exp_year: pm.card?.exp_year,
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            stripe_customer: pm.customer || null,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.warn("Mongo mirror failed (update PM):", e.message);
    }

    res.json({
      id: pm.id,
      billing_name: pm.billing_details?.name || null,
      exp_month: pm.card?.exp_month,
      exp_year: pm.card?.exp_year,
    });
  } catch (err) {
    console.error("update payment-method error:", err);
    res.status(400).json({ error: err.message || "update failed" });
  }
};

const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { pmId } = req.body;
    if (!pmId) return res.status(400).json({ error: "pmId is required" });
    const customer = await getOrCreateDemoCustomer();
    const updated = await stripe.customers.update(customer, {
      invoice_settings: { default_payment_method: pmId },
    });
    res.json({ success: true, customer: updated.id, default_pm: pmId });
  } catch (err) {
    console.error("set-default error:", err);
    res.status(400).json({ error: err.message || "set default failed" });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    await stripe.paymentMethods.detach(req.params.pmId);
    await Card.deleteOne({ pmId: req.params.pmId });
    res.json({ success: true });
  } catch (err) {
    console.error("detach payment-method error:", err);
    res.status(400).json({ error: err.message || "detach failed" });
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    let { amount, currency, payment_method, source, ref_id, description } = req.body;
    if (amount == null || !currency || !payment_method) {
      return res.status(400).json({ error: "amount, currency, and payment_method are required" });
    }

    amount = Number(amount);
    if (!Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({ error: "amount must be an integer (cents) >= 1" });
    }
    currency = String(currency).toLowerCase();

    source = (source ?? "").toString().trim() || null;
    ref_id = (ref_id ?? "").toString().trim() || null;
    description =
      (description ?? "").toString().trim() ||
      (source ? `${source.toUpperCase()} ${ref_id || ""}`.trim() : undefined);

    if (isDemoMode) {
      // Demo mode - simulate successful payment
      const demoPaymentId = "pi_demo_" + Date.now();
      
      // Save demo transaction to database
      await Tx.updateOne(
        { piId: demoPaymentId },
        {
          $set: {
            amount: amount,
            currency: currency,
            status: "succeeded",
            source,
            ref_id,
            description: description || "Demo payment",
          },
        },
        { upsert: true }
      );

      return res.json({ 
        success: true, 
        id: demoPaymentId, 
        status: "succeeded", 
        amount: amount 
      });
    }

    if (!stripe) {
      return res.status(503).json({ 
        error: "Payment service not configured. Please set up Stripe API keys or enable demo mode." 
      });
    }

    const customer = await getOrCreateDemoCustomer();

    const pm = await stripe.paymentMethods.retrieve(payment_method);
    if (!pm) return res.status(400).json({ error: "Invalid payment_method" });
    if (!pm.customer) {
      await stripe.paymentMethods.attach(payment_method, { customer });
    } else if (pm.customer !== customer) {
      return res.status(400).json({ error: "Payment method belongs to a different customer" });
    }

    const metadata = {};
    if (source) metadata.source = source;
    if (ref_id) metadata.ref_id = ref_id;

    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      customer,
      payment_method,
      confirm: true,
      off_session: true,
      automatic_payment_methods: { enabled: true },
      description,
      metadata,
    });

    if (pi.status === "requires_action" && pi.next_action?.type === "use_stripe_sdk") {
      return res.json({ requiresAction: true, clientSecret: pi.client_secret, amount: pi.amount });
    }

    await Tx.updateOne(
      { piId: pi.id },
      {
        $set: {
          amount: pi.amount,
          currency: pi.currency,
          status: pi.status,
          source,
          ref_id,
          description: pi.description || description || null,
        },
      },
      { upsert: true }
    );

    return res.json({ success: true, id: pi.id, status: pi.status, amount: pi.amount });
  } catch (err) {
    const pi = err?.raw?.payment_intent;
    if (pi && pi.status === "requires_action") {
      return res.json({ requiresAction: true, clientSecret: pi.client_secret, amount: pi.amount });
    }
    console.error("create-payment-intent error:", err);
    return res.status(400).json({ error: err.message || "create-payment-intent failed" });
  }
};

const createRefund = async (req, res) => {
  try {
    const { payment_intent, amount } = req.body;
    if (!payment_intent) return res.status(400).json({ error: "payment_intent is required" });
    const refund = await stripe.refunds.create({
      payment_intent,
      amount: amount ? Number(amount) : undefined,
    });
    res.json({ success: true, refund });
  } catch (err) {
    console.error("refund error:", err);
    res.status(400).json({ error: err.message || "refund failed" });
  }
};

const getCards = async (req, res) => {
  if (!mongoose.connection.readyState) return res.json([]);
  const cards = await Card.find({}).sort({ updatedAt: -1 }).lean();
  res.json(cards);
};

const getTransactions = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) return res.json([]);
    const q = {};
    if (req.query.source) q.source = req.query.source;
    if (req.query.ref) q.ref_id = req.query.ref;
    const tx = await Tx.find(q).sort({ createdAt: -1 }).lean();
    res.json(tx);
  } catch (e) {
    console.error("/api/db/tx error:", e);
    res.status(500).json({ error: "failed to fetch transactions" });
  }
};

const getAdminTransactions = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) return res.json([]);

    const {
      source,
      ref,
      currency,
      status,
      q,
      min,
      max,
      from, 
      to,   
    } = req.query;

    const query = {};

    if (source && source !== "any") query.source = source;
    if (currency && currency !== "any") query.currency = String(currency).toLowerCase();
    if (status && status !== "any") query.status = status;

    if (ref) {
      query.ref_id = { $regex: escapeRegex(ref), $options: "i" };
    }

    const minCents = Number.isFinite(Number(min)) ? Number(min) : null;
    const maxCents = Number.isFinite(Number(max)) ? Number(max) : null;
    if (minCents != null || maxCents != null) {
      query.amount = {};
      if (minCents != null) query.amount.$gte = minCents;
      if (maxCents != null) query.amount.$lte = maxCents;
    }

    if (from || to) {
      query.createdAt = {};
      if (from) {
        const d = new Date(from);
        d.setHours(0, 0, 0, 0);
        query.createdAt.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        d.setHours(23, 59, 59, 999);
        query.createdAt.$lte = d;
      }
    }

    if (q) {
      const rx = { $regex: escapeRegex(q), $options: "i" };
      query.$or = [{ description: rx }, { source: rx }, { ref_id: rx }];
    }

    const tx = await Tx.find(query).sort({ createdAt: -1 }).lean();
    res.json(tx);
  } catch (e) {
    console.error("/api/admin/tx error:", e);
    res.status(500).json({ error: "failed to fetch transactions" });
  }
};

const bulkDeleteTransactions = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: "database not connected" });
    }

    let { ids, all, source, ref } = req.body || {};

    if (!all && !ids && !source && !ref) {
      return res
        .status(400)
        .json({ error: "Provide 'all': true, or 'ids': [], or 'source/ref' to delete." });
    }

    if (all) {
      const r = await Tx.deleteMany({});
      return res.json({ success: true, deleted: r.deletedCount });
    }

    if (Array.isArray(ids) && ids.length) {
      const objIds = ids.filter((x) => isValidObjectId(x));
      const piIds = ids.filter((x) => !isValidObjectId(x));
      let d1 = { deletedCount: 0 },
        d2 = { deletedCount: 0 };
      if (objIds.length) d1 = await Tx.deleteMany({ _id: { $in: objIds } });
      if (piIds.length) d2 = await Tx.deleteMany({ piId: { $in: piIds } });
      return res.json({
        success: true,
        deleted: (d1.deletedCount || 0) + (d2.deletedCount || 0),
      });
    }

    const filter = {};
    if (source) filter.source = source;
    if (ref) filter.ref_id = ref;
    const r = await Tx.deleteMany(filter);
    return res.json({ success: true, deleted: r.deletedCount });
  } catch (e) {
    console.error("POST /api/admin/tx/bulk-delete error:", e);
    res.status(500).json({ error: "failed to delete transactions" });
  }
};

const deleteTransactions = async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(503).json({ error: "database not connected" });
    }

    let { ids, all, source, ref } = req.body || {};
    if (req.query.all === "true") all = true;

    if (!all && !ids && !source && !ref) {
      return res
        .status(400)
        .json({ error: "Provide 'all': true, or 'ids': [], or 'source/ref' to delete." });
    }

    if (all) {
      const r = await Tx.deleteMany({});
      return res.json({ success: true, deleted: r.deletedCount });
    }

    if (Array.isArray(ids) && ids.length) {
      const objIds = ids.filter((x) => isValidObjectId(x));
      const piIds = ids.filter((x) => !isValidObjectId(x));
      let d1 = { deletedCount: 0 },
        d2 = { deletedCount: 0 };
      if (objIds.length) d1 = await Tx.deleteMany({ _id: { $in: objIds } });
      if (piIds.length) d2 = await Tx.deleteMany({ piId: { $in: piIds } });
      return res.json({
        success: true,
        deleted: (d1.deletedCount || 0) + (d2.deletedCount || 0),
      });
    }

    const filter = {};
    if (source) filter.source = source;
    if (ref) filter.ref_id = ref;
    const r = await Tx.deleteMany(filter);
    return res.json({ success: true, deleted: r.deletedCount });
  } catch (e) {
    console.error("DELETE /api/db/tx error:", e);
    res.status(500).json({ error: "failed to delete transactions" });
  }
};

//Export all functions  
export {
  getOrder,
  createSetupIntent,
  getPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  createPaymentIntent,
  createRefund,
  getCards,
  getTransactions,
  getAdminTransactions,
  bulkDeleteTransactions,
  deleteTransactions
};

export default {
  getOrder,
  createSetupIntent,
  getPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  createPaymentIntent,
  createRefund,
  getCards,
  getTransactions,
  getAdminTransactions,
  bulkDeleteTransactions,
  deleteTransactions
};
