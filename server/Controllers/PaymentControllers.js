import "../loadEnv.js";
import mongoose from "mongoose";
import Stripe from "stripe";
import { Card, Tx } from "../Model/PaymentModel.js";
import AppointmentModel from "../Model/AppointmentModel.js";
import Address from "../Model/AddressModel.js";
import { getNextRef } from "../utils/ref.js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY must be defined in environment variables");
}
const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

let CACHED_CUSTOMER_ID = process.env.STRIPE_CUSTOMER_ID || null;


const FX_LKR_PER_USD = Number(process.env.FX_LKR_PER_USD || 300); 

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
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
    });
    return res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer,
    });
  } catch (error) {
    console.error("Setup intent creation error:", error);
    return res.status(400).json({
      error: error.message || "Failed to create setup intent",
    });
  }
};

// Get all saved payment cards
export const getPaymentMethods = async (req, res) => {
  try {
    const customer = await getOrCreateDemoCustomer();

    const paymentMethods = await stripe.paymentMethods.list({
      customer,
      type: "card",
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
          metadata: pm.metadata,
        });
      } else {
        await Card.findOneAndUpdate(
          { pmId: pm.id },
          {
            brand: pm.card.brand,
            last4: pm.card.last4,
            billing_name: pm.billing_details?.name || "",
            stripe_customer: customer,
            metadata: pm.metadata,
          }
        );
      }
    }

    const cards = await Card.find({ stripe_customer: customer })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json(cards);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment methods",
      error: error.message,
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
        metadata: paymentMethod.metadata,
      },
      { upsert: true, new: true }
    );

    res.json(card);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment method",
      error: error.message,
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
      console.error("Stripe detach failed (continuing):", err);
    }

    await Card.findOneAndDelete({ pmId });
    res.json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting payment method",
      error: error.message,
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
    if (billing_details && billing_details.name) updateData.billing_name = billing_details.name;
    if (typeof exp_month !== "undefined") updateData.exp_month = exp_month;
    if (typeof exp_year !== "undefined") updateData.exp_year = exp_year;

    console.log("Update Data:", updateData);

    const card = await Card.findOneAndUpdate({ pmId }, updateData, {
      upsert: true,
      new: true,
    });
    res.json(card);
  } catch (error) {
    console.error("ERROR in PATCH /payment-method/:pmId", error);
    res.status(500).json({
      success: false,
      message: "Error updating payment method",
      error: error.message,
    });
  }
};


function normalizeCountryToISO2(country) {
  if (!country) return "LK";
  const c = String(country).trim();
  if (c.toUpperCase() === "SRI LANKA") return "LK";
  if (c.length === 2) return c.toUpperCase();
  return "LK";
}


function buildShippingFromAddressDoc(addr) {
  if (!addr) return { shippingPayload: undefined, shippingMeta: {} };
  const fullName = [addr.firstName, addr.lastName].filter(Boolean).join(" ");
  const shippingPayload = {
    name: fullName || "Recipient",
    phone: addr.phone || undefined,
    address: {
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postal_code: addr.postalCode || "",
      country: normalizeCountryToISO2(addr.country || "Sri Lanka"),
    },
  };
  const shippingMeta = {
    address_id: addr._id.toString(),
    shipping_firstName: addr.firstName || "",
    shipping_lastName: addr.lastName || "",
    shipping_phone: addr.phone || "",
    shipping_line1: addr.line1 || "",
    shipping_line2: addr.line2 || "",
    shipping_city: addr.city || "",
    shipping_state: addr.state || "",
    shipping_postal_code: addr.postalCode || "",
    shipping_country: addr.country || "Sri Lanka",
  };
  return { shippingPayload, shippingMeta };
}


function buildShippingFromRaw({
  delivery = {},
  shipping = {},
  firstName, lastName, phone, line1, line2, city, state, postalCode, country,
}) {
  const nameFromDelivery = [delivery.firstName ?? firstName, delivery.lastName ?? lastName].filter(Boolean).join(" ");
  const fullName = shipping.name || nameFromDelivery || "Recipient";
  const phoneNum = delivery.phone ?? phone ?? shipping.phone ?? "";

  const line1F = delivery.line1 ?? line1 ?? shipping.address?.line1 ?? "";
  const line2F = delivery.line2 ?? line2 ?? shipping.address?.line2 ?? "";
  const cityF = delivery.city ?? city ?? shipping.address?.city ?? "";
  const stateF = delivery.state ?? state ?? shipping.address?.state ?? "";
  const postalF = delivery.postalCode ?? postalCode ?? shipping.address?.postal_code ?? "";
  const countryF = delivery.country ?? country ?? shipping.address?.country ?? "Sri Lanka";

  const provided = fullName || phoneNum || line1F || line2F || cityF || stateF || postalF || countryF;
  if (!provided) return { shippingPayload: undefined, shippingMeta: {} };

  const shippingPayload = {
    name: fullName,
    phone: phoneNum || undefined,
    address: {
      line1: line1F,
      line2: line2F,
      city: cityF,
      state: stateF,
      postal_code: postalF,
      country: normalizeCountryToISO2(countryF),
    },
  };
  const shippingMeta = {
    shipping_firstName: (delivery.firstName ?? firstName) || "",
    shipping_lastName: (delivery.lastName ?? lastName) || "",
    shipping_phone: phoneNum || "",
    shipping_line1: line1F || "",
    shipping_line2: line2F || "",
    shipping_city: cityF || "",
    shipping_state: stateF || "",
    shipping_postal_code: postalF || "",
    shipping_country: countryF || "Sri Lanka",
  };
  return { shippingPayload, shippingMeta };
}


async function resolveMartDelivery(req) {
  const {
    address_id,
    addressId,
    delivery_address_id,

    
    delivery,
    shipping,

    
    firstName, lastName, phone, line1, line2, city, state, postalCode, country,

    
    userId: rawUserId,
  } = req.body || {};

  const userId = (rawUserId && String(rawUserId).trim()) || "guest";
  const normalizedAddressId = String(address_id || addressId || delivery_address_id || "").trim();

  
  if (normalizedAddressId) {
    try {
      const addr = await Address.findById(normalizedAddressId).lean();
      if (addr) {
        console.log("[MART delivery] using address by id:", normalizedAddressId);
        return buildShippingFromAddressDoc(addr);
      }
      console.warn("[MART delivery] address not found by id:", normalizedAddressId);
    } catch (e) {
      console.warn("[MART delivery] address lookup failed:", e?.message || e);
    }
  }

  
  try {
    const latest = await Address.findOne({ userId }).sort({ updatedAt: -1, createdAt: -1 }).lean();
    if (latest) {
      console.log("[MART delivery] using latest address for userId:", userId);
      return buildShippingFromAddressDoc(latest);
    }
  } catch (e) {
    console.warn("[MART delivery] latest address lookup failed:", e?.message || e);
  }

  
  const built = buildShippingFromRaw({
    delivery,
    shipping,
    firstName, lastName, phone, line1, line2, city, state, postalCode, country,
  });
  if (built.shippingPayload) {
    console.log("[MART delivery] using raw delivery fields from request body");
    return built;
  }

  
  console.warn("[MART delivery] no delivery details available; invoice will show blanks");
  return { shippingPayload: undefined, shippingMeta: {} };
}


export const createPaymentIntent = async (req, res) => {
  try {
    let {
      amount,
      amount_lkr,
      payment_method,
      source,
      ref_id,
      description,
      currency,
    } = req.body;

    
    if (amount_lkr == null) {
      if (currency && String(currency).toLowerCase() === "lkr" && amount != null) {
        amount_lkr = Math.round(Number(amount));
      }
    }

    if (amount_lkr == null) {
      return res.status(400).json({
        error: "amount_lkr is required (integer rupees).",
      });
    }

    amount_lkr = Math.round(Number(amount_lkr));
    if (!Number.isFinite(amount_lkr) || amount_lkr < 1) {
      return res.status(400).json({
        error: "amount_lkr must be a valid integer >= 1",
        received: amount_lkr,
      });
    }

    
    let src = (source || "").toString().trim().toLowerCase();
    if (src !== "hospital" && src !== "mart") {
      const desc = (description || "").toString().toLowerCase();
      if (desc.includes("mart")) src = "mart";
      else if (desc.includes("hospital")) src = "hospital";
      else src = "unknown";
    }

    
    let appointmentId = null;
    let apptPrettyRef = null;
    if (src === "hospital") {
      appointmentId = ref_id && String(ref_id).trim() ? String(ref_id).trim() : null;
      apptPrettyRef = await getNextRef("APPT");
    }

    
    let martPrettyRef = null;
    if (src === "mart") {
      const incomingRef = ref_id && String(ref_id).trim() ? String(ref_id).trim() : null;
      if (!incomingRef) {
        martPrettyRef = await getNextRef("MART"); 
      }
    }

    
    const amount_usd_cents = Math.round((amount_lkr / FX_LKR_PER_USD) * 100);

    
    const minLkr = Math.ceil(0.5 * FX_LKR_PER_USD);
    if (amount_usd_cents < 50) {
      return res.status(400).json({
        error: `Minimum charge is $0.50 (≈ LKR ${minLkr}). Increase the amount.`,
        received_lkr: amount_lkr,
        rate_lkr_per_usd: FX_LKR_PER_USD,
      });
    }

    if (!payment_method) {
      return res.status(400).json({
        error: "Payment method is required",
        received: { payment_method },
      });
    }

    const customer = await getOrCreateDemoCustomer();

    // Validate payment method
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
      console.error("Payment method validation error:", err);
      return res.status(400).json({
        error: "Invalid payment method",
        details: err.message,
      });
    }

    
    const incomingRef = ref_id && String(ref_id).trim() ? String(ref_id).trim() : "";
    const metaRefId =
      src === "hospital"
        ? (appointmentId || incomingRef)
        : src === "mart"
        ? (martPrettyRef || incomingRef)
        : incomingRef;

    const metaPrettyRef = src === "hospital" ? (apptPrettyRef || "") : src === "mart" ? (martPrettyRef || "") : "";

    
    let shippingPayload = undefined;
    let shippingMeta = {};
    if (src === "mart") {
      const resolved = await resolveMartDelivery(req);
      shippingPayload = resolved.shippingPayload;
      shippingMeta = resolved.shippingMeta;
      if (shippingPayload) {
        console.log("[MART delivery] shipping attached to PI:", {
          name: shippingPayload.name,
          phone: shippingPayload.phone,
          address: shippingPayload.address,
        });
      } else {
        console.warn("[MART delivery] no shippingPayload generated (invoice will have blanks)");
      }
    }

    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount_usd_cents, 
      currency: "usd", 
      customer,
      payment_method,
      confirm: true,
      off_session: true,
      description: description || (src === "mart" ? "Mart purchase payment" : "Hospital appointment payment"),
      metadata: {
        source: src, 
        ref_id: metaRefId,
        pretty_ref: metaPrettyRef,
        original_amount_lkr: String(amount_lkr),
        display_currency: "lkr",
        exchange_rate_lkr_per_usd: String(FX_LKR_PER_USD),
        ...(src === "mart" ? shippingMeta : {}),
      },
      ...(shippingPayload ? { shipping: shippingPayload } : {}),
      confirmation_method: "automatic",
    });

    
    const displayRef = apptPrettyRef || martPrettyRef || incomingRef || "";

    // Save transaction
    await Tx.create({
      piId: paymentIntent.id,
      amount: paymentIntent.amount, 
      currency: paymentIntent.currency, 
      status: paymentIntent.status,
      source: src, 
      ref_id: displayRef,
      description: description || (src === "mart" ? "Mart purchase payment" : "Hospital appointment payment"),
      stripe_customer: customer,
      payment_method,
      metadata: paymentIntent.metadata,

      
      amount_lkr: amount_lkr,
      exchange_rate_lkr_per_usd: FX_LKR_PER_USD,
      display_currency: "lkr",
    });

    if (paymentIntent.status === "succeeded") {
      if (src === "hospital" && appointmentId) {
        await AppointmentModel.findByIdAndUpdate(appointmentId, {
          paymentStatus: "completed",
          paymentIntentId: paymentIntent.id,
          updatedAt: new Date(),
        });
      }
      return res.json({
        success: true,
        amount: paymentIntent.amount, 
        currency: paymentIntent.currency,
        amount_lkr: amount_lkr,
        display_currency: "lkr",
        exchange_rate_lkr_per_usd: FX_LKR_PER_USD,
        id: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        ref_id: displayRef || null,
      });
    } else if (paymentIntent.status === "requires_action") {
      return res.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      return res.json({
        success: false,
        status: paymentIntent.status,
        message: "Payment requires additional handling",
      });
    }
  } catch (error) {
    console.error("Payment intent creation error:", error);
    return res.status(400).json({
      error: error.message,
      type: error.type,
      code: error.code,
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
      message: "Error fetching all payments",
      error: error.message,
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
        message: "Appointment ID is required",
      });
    }
    const updatedAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        paymentIntentId,
        paymentStatus,
        updatedAt: new Date(),
      },
      { new: true }
    );
    if (!updatedAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }
    res.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Error updating appointment payment status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating appointment payment status",
      error: error.message,
    });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await Tx.findOneAndUpdate({ piId: paymentIntent.id }, { status: paymentIntent.status });
        if (paymentIntent.metadata?.source === "hospital" && paymentIntent.metadata?.ref_id) {
          await AppointmentModel.findByIdAndUpdate(paymentIntent.metadata.ref_id, {
            paymentStatus: "completed",
            paymentIntentId: paymentIntent.id,
            updatedAt: new Date(),
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const failedPayment = event.data.object;
        await Tx.findOneAndUpdate({ piId: failedPayment.id }, { status: failedPayment.status });
        if (failedPayment.metadata?.source === "hospital" && failedPayment.metadata?.ref_id) {
          await AppointmentModel.findByIdAndUpdate(failedPayment.metadata.ref_id, {
            paymentStatus: "failed",
            paymentIntentId: failedPayment.id,
            updatedAt: new Date(),
          });
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};