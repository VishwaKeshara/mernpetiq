import "../loadEnv.js";
import fs from "fs";
import PDFDocument from "pdfkit";
import Stripe from "stripe";
import { Tx } from "../Model/PaymentModel.js";
import AppointmentModel from "../Model/AppointmentModel.js";
import Address from "../Model/AddressModel.js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY must be defined in environment variables");
}
const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });


const BRAND = {
  name: process.env.COMPANY_NAME || "PetIQ",
  color: (process.env.PETIQ_BRAND_COLOR || "#F59E0B").toUpperCase(),  
  light: (process.env.PETIQ_BRAND_LIGHT || "#FDE68A").toUpperCase(),  
  textOnBrand: (process.env.PETIQ_BRAND_TEXT || "#FFFFFF").toUpperCase(),
  gray900: "#111827",
  gray700: "#374151",
  gray600: "#4B5563",
  gray500: "#6B7280",
  gray300: "#D1D5DB",
  gray100: "#F3F4F6",
};
const COMPANY = {
  address: process.env.COMPANY_ADDRESS || "Sri Lanka",
  website: process.env.COMPANY_WEBSITE || "https://petiq.lk",
  email: process.env.SUPPORT_EMAIL || "support@petiq.lk",
  phone: process.env.SUPPORT_PHONE || "+94 000 000 000",
};
const LOGO_PATH = process.env.PETIQ_LOGO_PATH || ""; 


function formatLKR(n) {
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `LKR ${Number(n || 0).toFixed(0)}`;
  }
}
function toDisplayTime(d) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d?.toISOString?.() || String(d || "");
  }
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}


function fitText(doc, text, maxWidth, font = "Helvetica", size = 11) {
  doc.font(font).fontSize(size);
  const s = String(text ?? "");
  if (doc.widthOfString(s) <= maxWidth) return s;
  const ellipsis = "…";
  let lo = 0, hi = s.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const candidate = s.slice(0, mid) + ellipsis;
    if (doc.widthOfString(candidate) <= maxWidth) lo = mid + 1;
    else hi = mid;
  }
  const result = s.slice(0, Math.max(0, lo - 1)) + ellipsis;
  return result || ellipsis;
}
function drawTextL(doc, text, x, y, maxW, font = "Helvetica", size = 11, color = BRAND.gray900) {
  const s = fitText(doc, text, maxW, font, size);
  doc.font(font).fontSize(size).fillColor(color).text(s, x, y, { lineBreak: false });
}
function drawTextR(doc, text, rightX, y, maxW, font = "Helvetica", size = 11, color = BRAND.gray900) {
  const s = fitText(doc, text, maxW, font, size);
  const w = doc.widthOfString(s);
  const x = rightX - Math.min(w, maxW);
  doc.font(font).fontSize(size).fillColor(color).text(s, x, y, { lineBreak: false });
}
function labelValueRow(doc, label, value, x, rightX, y, labelW, valueW) {
  drawTextL(doc, label, x, y, labelW, "Helvetica", 10, BRAND.gray600);
  drawTextR(doc, value ?? "—", rightX, y, valueW, "Helvetica-Bold", 11, BRAND.gray900);
}


async function buildTxView({ tx, pi, deliveryAddressId }) {
  let amount_lkr =
    toNum(tx?.amount_lkr) ??
    toNum(tx?.metadata?.original_amount_lkr) ??
    toNum(pi?.metadata?.original_amount_lkr) ??
    0;

  const purpose =
    tx?.description ||
    pi?.description ||
    (pi?.metadata?.source === "mart" ? "Mart purchase payment" : "Hospital appointment payment");

  const ref =
    tx?.ref_id ||
    pi?.metadata?.pretty_ref ||
    pi?.metadata?.ref_id ||
    "";

  const created =
    tx?.createdAt ? new Date(tx.createdAt) : (pi?.created ? new Date(pi.created * 1000) : new Date());

  const issuedAt = toDisplayTime(created);
  const source = (tx?.source || pi?.metadata?.source || "unknown").toString().toLowerCase();
  const status = tx?.status || pi?.status || "succeeded";

  
  let appointment = null;
  if (source === "hospital") {
    const apptId = tx?.metadata?.ref_id || pi?.metadata?.ref_id || "";
    if (apptId) {
      try { appointment = await AppointmentModel.findById(apptId).lean(); } catch {}
    }
  }

  let address = null;
  if (source === "mart") {
    
    if (deliveryAddressId) {
      try {
        address = await Address.findById(deliveryAddressId).lean();
        if (address) {
          console.log("DIRECT HIT: Using delivery address from explicit parameter:", deliveryAddressId);
        }
      } catch (e) {
        console.error("Error finding address by explicit parameter:", deliveryAddressId, e);
      }
    }
    
    
    if (!address) {
      
      const lsAddressId = tx?.metadata?.vms_selectedAddressId || pi?.metadata?.vms_selectedAddressId;
      if (lsAddressId) {
        try {
          address = await Address.findById(lsAddressId).lean();
          if (address) {
            console.log("SUCCESS: Found address from vms_selectedAddressId:", lsAddressId);
          }
        } catch (e) {
          console.error("Error with vms_selectedAddressId:", e);
        }
      }
    }
    
    
    if (!address) {
      let addressId = "";
      
      if (tx?.metadata?.delivery_address_id) {
        addressId = tx.metadata.delivery_address_id;
        console.log("Using delivery_address_id from transaction metadata:", addressId);
      } else if (tx?.metadata?.address_id) {
        addressId = tx.metadata.address_id;
        console.log("Using address_id from transaction metadata:", addressId);
      } else if (pi?.metadata?.address_id) {
        addressId = pi.metadata.address_id;
        console.log("Using address_id from payment intent metadata:", addressId);
      } else if (pi?.metadata?.delivery_address_id) {
        addressId = pi.metadata.delivery_address_id;
        console.log("Using delivery_address_id from payment intent metadata:", addressId);
      } else if (tx?.metadata?.addressId) {
        addressId = tx.metadata.addressId;
        console.log("Using addressId from transaction metadata:", addressId);
      } else if (pi?.metadata?.addressId) {
        addressId = pi.metadata.addressId;
        console.log("Using addressId from payment intent metadata:", addressId);
      }
      
      if (addressId) {
        try { 
          address = await Address.findById(addressId).lean();
          console.log("Found delivery address by ID:", addressId);
        } catch (e) {
          console.error("Error finding address by ID:", addressId, e);
        }
      }
    }
    if (!address && pi?.shipping?.address) {
      const a = pi.shipping.address;
      address = {
        firstName: pi.shipping.name || "",
        lastName: "",
        phone: pi.shipping.phone || "",
        line1: a.line1 || "",
        line2: a.line2 || "",
        city: a.city || "",
        state: a.state || "",
        postalCode: a.postal_code || "",
        country: a.country || "Sri Lanka",
      };
    }
  }

  if (!Number.isFinite(amount_lkr) || amount_lkr < 0) amount_lkr = 0;

  return {
    amount_lkr,
    purpose: String(purpose || "").trim(),
    ref: String(ref || "").trim(),
    issuedAt,
    source,   
    status,
    appointment,
    address,
  };
}


function drawHeader(doc, v) {
  const pgW = doc.page.width;
  const margin = doc.page.margins.left;
  const barH = 84;

  
  doc.save();
  doc.rect(0, 0, pgW, barH).fill(BRAND.color);

  
  let x = margin;
  if (LOGO_PATH && fs.existsSync(LOGO_PATH)) {
    try { doc.image(LOGO_PATH, x, 16, { height: 48 }); x += 60; } catch {}
  }
  drawTextL(doc, BRAND.name, x, 20, 260, "Helvetica-Bold", 24, BRAND.textOnBrand);
  drawTextL(doc, COMPANY.website, x, 46, 260, "Helvetica", 10, BRAND.textOnBrand);

  
  const rightW = 220;
  const rightX = pgW - margin;
  drawTextR(doc, "INVOICE", rightX, 18, rightW, "Helvetica-Bold", 18, BRAND.textOnBrand);
  drawTextR(doc, `Invoice No: ${v.ref || "—"}`, rightX, 44, rightW, "Helvetica", 10, BRAND.textOnBrand);
  drawTextR(doc, `Issued: ${v.issuedAt}`, rightX, 60, rightW, "Helvetica", 10, BRAND.textOnBrand);

  doc.restore();
}

function drawPaidWatermark(doc, v) {
  if ((v.status || "").toLowerCase() !== "succeeded") return;
  const pgW = doc.page.width;
  const pgH = doc.page.height;
  doc.save();
  doc.rotate(-30, { origin: [pgW / 2, pgH / 2] });
  drawTextL(doc, "PAID", pgW / 2 - 150, pgH / 2 - 50, 300, "Helvetica-Bold", 78, BRAND.light);
  doc.restore();
}

function drawSummary(doc, v) {
  const margin = doc.page.margins.left;
  const top = 110;
  const boxW = doc.page.width - margin * 2;
  const boxH = 106;

  doc.save();
  doc.roundedRect(margin, top, boxW, boxH, 12).stroke(BRAND.gray300);

  
  const leftW = boxW * 0.46;
  doc.roundedRect(margin + 12, top + 14, leftW - 24, boxH - 28, 10).lineWidth(0.8).stroke(BRAND.gray300);
  drawTextL(doc, "Amount Paid", margin + 22, top + 22, leftW - 44, "Helvetica", 11, BRAND.gray600);
  drawTextL(doc, formatLKR(v.amount_lkr), margin + 22, top + 44, leftW - 44, "Helvetica-Bold", 28, BRAND.gray900);

  
  const midX = margin + boxW * 0.5;
  doc.moveTo(midX, top + 14).lineTo(midX, top + boxH - 14).stroke(BRAND.gray300);

  
  const rightEdge = margin + boxW - 12;
  const labelW = 110;
  const valueW = boxW - (midX + 16 - margin) - 24 - labelW;
  let y = top + 22;

  labelValueRow(doc, "Purpose", v.purpose, midX + 16, rightEdge, y, labelW, valueW); y += 20;
  labelValueRow(doc, "Reference", v.ref,   midX + 16, rightEdge, y, labelW, valueW); y += 20;
  labelValueRow(doc, "Source",    v.source.toUpperCase(), midX + 16, rightEdge, y, labelW, valueW);

  doc.restore();
}


function drawDetails(doc, v) {
  const margin = doc.page.margins.left;
  const top = 238;
  const sectionW = doc.page.width - margin * 2;

  const isHospital = v.source === "hospital";
  const title = isHospital ? "Billing Details (Appointment)" : "Billing Details (Delivery)";

  drawTextL(doc, title, margin, top, sectionW, "Helvetica-Bold", 12, BRAND.gray900);
  doc.moveTo(margin, top + 16).lineTo(margin + sectionW, top + 16).stroke(BRAND.gray300);

  if (!isHospital) {
    
    const d = v.address || {};
    const fullName = [d.firstName, d.lastName].filter(Boolean).join(" ");
    const fullAddress = [d.line1, d.line2, d.city, d.state, d.postalCode, d.country || "Sri Lanka"].filter(Boolean).join(", ");
    let y = top + 26;
    const labelW = 120;
    drawTextL(doc, "Recipient", margin, y, labelW, "Helvetica", 10, BRAND.gray600);
    drawTextL(doc, fullName || "—", margin + labelW, y, sectionW - labelW, "Helvetica", 11, BRAND.gray900); y += 18;

    drawTextL(doc, "Phone", margin, y, labelW, "Helvetica", 10, BRAND.gray600);
    drawTextL(doc, d.phone || "—", margin + labelW, y, sectionW - labelW, "Helvetica", 11, BRAND.gray900); y += 18;

    drawTextL(doc, "Address", margin, y, labelW, "Helvetica", 10, BRAND.gray600);
    drawTextL(doc, fullAddress || "—", margin + labelW, y, sectionW - labelW, "Helvetica", 11, BRAND.gray900); y += 18;

    return y;
  }

  
  const a = v.appointment || {};
  const leftRows = [
    ["Owner Name", a.ownerName],
    ["Pet Name",   a.petName],
    ["Pet Type",   a.petType],
    ["Service",    a.service],
  ];
  const rightRows = [
    ["Vet",   a.vet],
    ["Date",  a.date],
    ["Time",  a.time],
    ["Price", a.price != null ? formatLKR(a.price) : ""],
  ];

  
  const colGap = 36;
  const colW = (sectionW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;

  const labelW = 110;
  const valueW = colW - labelW;

  let yLeft = top + 26;
  let yRight = top + 26;
  const lineH = 18;

  
  for (const [label, val] of leftRows) {
    drawTextL(doc, label, leftX, yLeft, labelW, "Helvetica", 10, BRAND.gray600);
    drawTextL(doc, val || "—", leftX + labelW, yLeft, valueW, "Helvetica", 11, BRAND.gray900);
    yLeft += lineH;
  }

  
  for (const [label, val] of rightRows) {
    drawTextL(doc, label, rightX, yRight, labelW, "Helvetica", 10, BRAND.gray600);
    drawTextL(doc, val || "—", rightX + labelW, yRight, valueW, "Helvetica", 11, BRAND.gray900);
    yRight += lineH;
  }

  const bottomY = Math.max(yLeft, yRight);
  return bottomY;
}


function drawFooter(doc, detailsBottomY) {
  const margin = doc.page.margins.left;
  const pgW = doc.page.width;
  const pgH = doc.page.height;

  
  const minBaseline = 300;
  const footerReserve = 120;
  const maxBandTop = pgH - footerReserve - 40; 
  let bandTop = Math.max(detailsBottomY + 18, minBaseline);
  bandTop = Math.min(bandTop, maxBandTop);

  
  doc.roundedRect(margin, bandTop, pgW - margin * 2, 8, 4).fill(BRAND.light);

  
  drawTextL(doc, "Notes", margin, bandTop + 16, pgW - margin * 2, "Helvetica-Bold", 12, BRAND.gray900);
  drawTextL(
    doc,
    "This invoice acknowledges receipt of payment. For questions, contact support.",
    margin,
    bandTop + 30,
    pgW - margin * 2,
    "Helvetica",
    10,
    BRAND.gray600
  );

  // Footer bar
  const ftTop = pgH - 80;
  doc.rect(0, ftTop, pgW, 80).fill(BRAND.gray100);

  drawTextL(doc, BRAND.name,          margin, ftTop + 14, 260, "Helvetica-Bold", 12, BRAND.gray900);
  drawTextL(doc, COMPANY.address,     margin, ftTop + 30, 260, "Helvetica", 10, BRAND.gray600);
  drawTextL(doc, COMPANY.website,     margin, ftTop + 44, 260, "Helvetica", 10, BRAND.gray600);
  drawTextL(doc, COMPANY.email,       margin, ftTop + 58, 260, "Helvetica", 10, BRAND.gray600);

  drawTextR(doc, "Thank you for choosing PetIQ!", pgW - margin, ftTop + 32, 260, "Helvetica-Bold", 13, BRAND.gray900);
}

function renderOnePage(doc, v) {
  drawHeader(doc, v);
  drawPaidWatermark(doc, v);
  drawSummary(doc, v);
  const detailsBottom = drawDetails(doc, v);      
  drawFooter(doc, detailsBottom);                 
}

function sendPdf(res, filename, view) {
  
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: false,
    autoFirstPage: true,
  });


  doc.addPage = function () { return this; };
  doc.on("pageAdded", () => { /* no-op */ });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);

  renderOnePage(doc, view);

  doc.end();
}


export async function getInvoice(req, res) {
  try {
    const ref_id = (req.query.ref_id || "").toString().trim();
    const payment_intent_id = (req.query.payment_intent_id || "").toString().trim();
    // Get delivery address ID from query parameters
    const deliveryAddressId = req.query.deliveryAddressId || req.query.addressId || "";

    let tx = null;
    if (ref_id) tx = await Tx.findOne({ ref_id }).sort({ createdAt: -1 }).lean();
    if (!tx && payment_intent_id) tx = await Tx.findOne({ piId: payment_intent_id }).lean();

    let pi = null;
    const piCandidate =
      (payment_intent_id && payment_intent_id.startsWith("pi_")) ? payment_intent_id :
      (tx?.piId && tx.piId.startsWith("pi_")) ? tx.piId : null;

    if (piCandidate) {
      try { pi = await stripe.paymentIntents.retrieve(piCandidate); } catch {}
    }

    if (!tx && !pi) return res.status(404).json({ error: "Invoice not found for provided parameters." });

    // Pass the delivery address ID to buildTxView
    const view = await buildTxView({ tx, pi, deliveryAddressId });
    const base = view.ref || "payment";
    sendPdf(res, `Invoice-${base}.pdf`, view);
  } catch (e) {
    console.error("GET /invoice failed:", e);
    res.status(500).json({ error: "Failed to generate invoice." });
  }
}

export async function getInvoiceByParam(req, res) {
  try {
    const id = (req.params.id || "").toString().trim();
    
    // Get the delivery address ID from query parameters if present
    const deliveryAddressId = req.query.deliveryAddressId || req.query.addressId || "";

    let tx = null;
    if (id.startsWith("pi_")) tx = await Tx.findOne({ piId: id }).lean();
    if (!tx) tx = await Tx.findOne({ ref_id: id }).lean();

    let pi = null;
    const piCandidate = id.startsWith("pi_") ? id : (tx?.piId || "");
    if (piCandidate && piCandidate.startsWith("pi_")) {
      try { pi = await stripe.paymentIntents.retrieve(piCandidate); } catch {}
    }

    if (!tx && !pi) return res.status(404).json({ error: "Invoice not found." });

    const view = await buildTxView({ tx, pi, deliveryAddressId });
    const base = view.ref || "payment";
    sendPdf(res, `Invoice-${base}.pdf`, view);
  } catch (e) {
    console.error("GET /payments/:id/invoice failed:", e);
    res.status(500).json({ error: "Failed to generate invoice." });
  }
}