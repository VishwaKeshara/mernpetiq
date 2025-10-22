import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { paymentBaseURL } from "../../axiosinstance";
import { useCart } from "../../context/CartContext";


const APP_NAME = "PetIQ.lk";
const APP_URL = "https://petiq.lk";
const LS_INVOICE_DELIVERY = "invoice:lastDeliverySnapshot"; 


const formatLKR = (value) => {
  try {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `LKR ${Number(value || 0).toFixed(0)}`;
  }
};

const titleCase = (str = "") =>
  String(str)
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function resolveUserId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("userId");
  const fromLS =
    localStorage.getItem("userId") ||
    localStorage.getItem("auth:userId") ||
    localStorage.getItem("uid");
  return (fromQuery || fromLS || "guest").toString().trim() || "guest";
}

function joinAddressParts(obj = {}) {
  const parts = [
    obj.line1,
    obj.line2,
    obj.city,
    obj.state,
    obj.postalCode,
    obj.country,
  ]
    .map((x) => (x || "").toString().trim())
    .filter(Boolean);
  return parts.join(", ");
}


function scoreDelivery(s) {
  if (!s || typeof s !== "object") return 0;
  const keys = ["firstName","lastName","phone","line1","line2","city","state","postalCode","country"];
  return keys.reduce((n, k) => n + (s[k] && String(s[k]).trim() ? 1 : 0), 0);
}


function bestDeliverySnapshot(...cands) {
  let best = null;
  let bestScore = -1;
  for (const c of cands) {
    const n = c && typeof c === "object" ? normalizeAddressSnapshot(c) : null;
    const sc = scoreDelivery(n);
    if (sc > bestScore) {
      best = n;
      bestScore = sc;
    }
  }
  return best;
}


function setInvoiceSnapshotIfBetter(next) {
  if (!next) return;
  try {
    const curRaw = localStorage.getItem(LS_INVOICE_DELIVERY);
    const cur = curRaw ? JSON.parse(curRaw) : null;
    const chosen = bestDeliverySnapshot(cur, next); 
    if (scoreDelivery(chosen) > scoreDelivery(cur)) {
      localStorage.setItem(LS_INVOICE_DELIVERY, JSON.stringify(chosen));
      try { window.__LAST_DELIVERY__ = chosen; } catch {}
    }
  } catch {
    try {
      localStorage.setItem(LS_INVOICE_DELIVERY, JSON.stringify(next));
      try { window.__LAST_DELIVERY__ = next; } catch {}
    } catch {}
  }
}


function normalizeAddressSnapshot(a) {
  if (!a) return null;
  if (typeof a === "string") {
    const t = a.trim();
    if (!t) return null;
    return {
      firstName: "",
      lastName: "",
      phone: "",
      line1: t,
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Sri Lanka",
    };
  }
  if (typeof a !== "object") return null;

  const fullName = a.fullName || a.recipientName || a.name || a.recipient || a.customerName || "";

  const firstName =
    a.firstName ||
    a.first_name ||
    a.fname ||
    (fullName && String(fullName).trim().split(" ")[0]) ||
    "";
  const lastName =
    a.lastName ||
    a.last_name ||
    a.lname ||
    (fullName && String(fullName).trim().split(" ").slice(1).join(" ")) ||
    "";

  const phone =
    a.phone ||
    a.mobile ||
    a.mobileNo ||
    a.phone_no ||
    a.phoneNumber ||
    a.contact ||
    a.contactNumber ||
    a.telephone ||
    a.tel ||
    "";

  const line1 =
    a.line1 ||
    a.addr1 ||
    a.address1 ||
    a.addressLine1 ||
    a.street1 ||
    a.street ||
    a.streetAddress ||
    a.address ||
    a.fullAddress ||
    a.addressText ||
    a.addressStr ||
    "";

  const line2 =
    a.line2 ||
    a.addr2 ||
    a.address2 ||
    a.addressLine2 ||
    a.street2 ||
    a.landmark ||
    "";

  const city = a.city || a.town || a.district || "";
  const state = a.state || a.region || a.province || "";
  const postalCode = a.postalCode || a.zip || a.zipcode || a.postal || a.zip_code || "";
  const country = a.country || a.country_name || "Sri Lanka";

  const out = {
    firstName: String(firstName || "").trim(),
    lastName: String(lastName || "").trim(),
    phone: String(phone || "").trim(),
    line1: String(line1 || "").trim(),
    line2: String(line2 || "").trim(),
    city: String(city || "").trim(),
    state: String(state || "").trim(),
    postalCode: String(postalCode || "").trim(),
    country: String(country || "Sri Lanka").trim(),
  };

  if (!out.line1 && typeof a.address === "string") out.line1 = a.address.trim();

  if ((!out.firstName || !out.lastName) && a.user && typeof a.user === "object") {
    const uf = a.user.firstName || a.user.first_name || a.user.fname || "";
    const ul = a.user.lastName || a.user.last_name || a.user.lname || "";
    out.firstName ||= uf;
    out.lastName ||= ul;
  }

  return out;
}


function deepFindAddressLike(obj, maxDepth = 5) {
  if (!obj || typeof obj !== "object" || maxDepth < 0) return null;

  let best = null;
  let bestScore = 0;

  const tryNormalize = normalizeAddressSnapshot(obj);
  const score = (s) => scoreDelivery(s);

  if (tryNormalize) {
    const sc = score(tryNormalize);
    if (sc > bestScore) {
      best = tryNormalize;
      bestScore = sc;
    }
  }

  const iterate = (value) => {
    const cand = deepFindAddressLike(value, maxDepth - 1);
    const sc = score(cand);
    if (sc > bestScore) {
      best = cand;
      bestScore = sc;
    }
  };

  if (Array.isArray(obj)) {
    for (const item of obj) iterate(item);
  } else {
    for (const k of Object.keys(obj)) iterate(obj[k]);
  }

  return best;
}


function findAnyAddressInLocalStorage() {
  let best = null;
  let bestLen = -1;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const raw = localStorage.getItem(key);
    if (!raw || raw.length < 2) continue;
    try {
      const parsed = JSON.parse(raw);
      const found = deepFindAddressLike(parsed, 4);
      const joined = joinAddressParts(found || {});
      if (found && joined.length > bestLen) {
        best = found;
        bestLen = joined.length;
      }
    } catch {
      // ignore parse errors
    }
  }
  return best || null;
}

function readDeliveryFromQuery() {
  const p = new URLSearchParams(window.location.search);
  const hasAny =
    p.get("firstName") ||
    p.get("lastName") ||
    p.get("phone") ||
    p.get("line1") ||
    p.get("addr1") ||
    p.get("address") ||
    p.get("city") ||
    p.get("state") ||
    p.get("postalCode") ||
    p.get("zip") ||
    p.get("country") ||
    p.get("recipient") ||
    p.get("fullName") ||
    p.get("name");
  if (!hasAny) return null;

  const s = {
    firstName:
      p.get("firstName") ||
      p.get("fname") ||
      (p.get("recipient") || p.get("fullName") || p.get("name") || "")
        .split(" ")[0] ||
      "",
    lastName:
      p.get("lastName") ||
      p.get("lname") ||
      (p.get("recipient") || p.get("fullName") || p.get("name") || "")
        .split(" ")
        .slice(1)
        .join(" ") ||
      "",
    phone: p.get("phone") || p.get("mobile") || p.get("phoneNumber") || p.get("telephone") || "",
    line1:
      p.get("line1") ||
      p.get("addr1") ||
      p.get("address1") ||
      p.get("addressLine1") ||
      p.get("street1") ||
      p.get("address") ||
      "",
    line2:
      p.get("line2") ||
      p.get("addr2") ||
      p.get("address2") ||
      p.get("addressLine2") ||
      p.get("street2") ||
      p.get("landmark") ||
      "",
    city: p.get("city") || p.get("town") || p.get("district") || "",
    state: p.get("state") || p.get("region") || p.get("province") || "",
    postalCode: p.get("postalCode") || p.get("zip") || p.get("zipcode") || p.get("postal") || "",
    country: p.get("country") || "Sri Lanka",
  };
  return normalizeAddressSnapshot(s);
}


function getSelectedAddressInfo() {
  const params = new URLSearchParams(window.location.search);

  const addressId =
    params.get("selectedAddressId") ||
    params.get("addressId") ||
    params.get("address_id") ||
    params.get("delivery_address_id") ||
    localStorage.getItem("selectedAddressId") ||
    localStorage.getItem("address:selected_id") ||
    localStorage.getItem("vms:selectedAddressId") ||
    "";

  
  let delivery = readDeliveryFromQuery();

  
  const snapshotKeys = [
    LS_INVOICE_DELIVERY, 
    "selectedAddress",
    "mart:selectedAddress",
    "address:selected_json",
    "deliveryAddress",
    "shippingAddress",
  ];

  if (!delivery) {
    for (const k of snapshotKeys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const normalized = normalizeAddressSnapshot(parsed);
        if (normalized) {
          delivery = normalized;
          break;
        }
      } catch {}
    }
  }

  if (!delivery) {
    delivery = findAnyAddressInLocalStorage();
  }

  return {
    addressId: addressId && String(addressId).trim() ? String(addressId).trim() : null,
    delivery,
  };
}


async function fetchAddressSnapshotById(addressId, userId) {
  
  try {
    const { data } = await paymentBaseURL.get("/addresses", {
      params: { userId: userId || "guest" },
    });
    const list = Array.isArray(data) ? data : [];
    const found = list.find((a) => String(a._id) === String(addressId));
    if (found) return normalizeAddressSnapshot(found);
  } catch {}

  
  try {
    const { data } = await paymentBaseURL.get(`/addresses/${encodeURIComponent(addressId)}`);
    const norm = normalizeAddressSnapshot(data);
    if (norm) return norm;
  } catch {}

  
  try {
    const { data } = await paymentBaseURL.get(`/address/${encodeURIComponent(addressId)}`);
    const norm = normalizeAddressSnapshot(data);
    if (norm) return norm;
  } catch {}

  return null;
}

async function fetchFallbackAddressSnapshot(userId) {
  try {
    const { data } = await paymentBaseURL.get("/addresses", {
      params: { userId: userId || "guest" },
    });
    const list = Array.isArray(data) ? data : [];
    if (!list.length) return null;
    const pick = list[list.length - 1];
    return normalizeAddressSnapshot(pick);
  } catch (error) {
    console.log("Error fetching address snapshot:", error);
    return null;
  }
}


function extractDeliveryFromAny(obj) {
  if (!obj || typeof obj !== "object") return null;
  const candidates = [
    obj.delivery,
    obj.shippingAddress,
    obj.address,
    obj.billing_details,
    obj.order?.delivery,
    obj.order?.shippingAddress,
    obj.order?.address,
    obj.meta?.delivery,
    obj.data?.delivery,
  ].filter(Boolean);
  for (const c of candidates) {
    const norm = normalizeAddressSnapshot(c);
    if (norm) return norm;
  }
  const selfNorm = normalizeAddressSnapshot(obj);
  return selfNorm;
}


async function tryFetchDeliveryByRefOrPI({ refId, piId }) {
  const attempts = [];
  const addGet = (path, params) =>
    attempts.push(() =>
      paymentBaseURL
        .get(path, { params })
        .then((r) => r?.data)
        .catch(() => null)
    );

  if (refId) {
    addGet(`/orders/${encodeURIComponent(refId)}`);
    addGet(`/order/${encodeURIComponent(refId)}`);
    addGet(`/orders`, { ref_id: refId });
    addGet(`/order`, { ref_id: refId });
    addGet(`/invoice`, { ref_id: refId });
    addGet(`/payments/${encodeURIComponent(refId)}`);
    addGet(`/payment/${encodeURIComponent(refId)}`);
  }
  if (piId) {
    addGet(`/orders`, { payment_intent_id: piId });
    addGet(`/order`, { payment_intent_id: piId });
    addGet(`/invoice`, { payment_intent_id: piId });
    addGet(`/payments/${encodeURIComponent(piId)}`);
    addGet(`/payment/${encodeURIComponent(piId)}`);
  }
  
  addGet(`/orders/recent`);
  addGet(`/order/recent`);

  for (const fn of attempts) {
    try {
      const data = await fn();
      const delivery = extractDeliveryFromAny(data);
      if (delivery) return delivery;
    } catch {}
  }
  return null;
}


function readCartItemsFromStorage() {
  const keys = ["cart", "cartItems", "vms:cart", "vms:cartItems", "mart:cart", "mart:items"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.items)) return data.items;
    } catch {}
  }
  return [];
}

function readCartItemsFromContext(cartCtx) {
  if (!cartCtx || typeof cartCtx !== "object") return [];
  const candidates = [
    cartCtx.items,
    cartCtx.cartItems,
    cartCtx.products,
    cartCtx.cart?.items,
    cartCtx.cart,
    cartCtx.state?.items,
    cartCtx.state?.cartItems,
    cartCtx.state?.cart?.items,
  ];
  const arrays = candidates.filter((c) => Array.isArray(c));
  if (arrays.length) return arrays.flat();
  return [];
}

function normalizeCartItem(it) {
  const name =
    it?.name ||
    it?.title ||
    it?.productName ||
    it?.itemName ||
    it?.label ||
    it?.product?.name ||
    it?.product?.title ||
    it?.variant?.name ||
    it?.product_title ||
    it?.product_name ||
    "";

  const qty =
    it?.qty ??
    it?.quantity ??
    it?.count ??
    it?.qtyOrdered ??
    it?.product?.quantity ??
    it?.variant?.quantity ??
    it?.qty_ordered ??
    1;

  
  const rawUnit =
    it?.unitPrice ??
    it?.price ??
    it?.amount ??
    it?.product?.price ??
    it?.variant?.price ??
    null;
  const unitPrice = Number.isFinite(Number(rawUnit)) ? Number(rawUnit) : null;

  const safeQty = Number.isFinite(Number(qty)) ? Number(qty) : 1;
  const lineTotal = Number.isFinite(unitPrice) ? unitPrice * safeQty : null;

  return {
    name: String(name || "").trim(),
    qty: safeQty,
    unitPrice,   
    lineTotal,   
  };
}

function mergeItemsByName(items) {
  const map = new Map();
  for (const it of items) {
    const key = it.name || "";
    if (!key) continue;

    const prev = map.get(key) || { name: key, qty: 0, unitPrice: null, lineTotal: null };

    
    const mergedQty = (Number.isFinite(prev.qty) ? prev.qty : 0) + (Number.isFinite(it.qty) ? it.qty : 1);
    const mergedUnit = Number.isFinite(it.unitPrice) ? it.unitPrice : prev.unitPrice;

    const merged = {
      name: key,
      qty: mergedQty,
      unitPrice: mergedUnit,
      lineTotal: Number.isFinite(mergedUnit) ? mergedUnit * mergedQty : null,
    };

    map.set(key, merged);
  }
  return Array.from(map.values());
}

function buildMartPurposeData({ cartCtx }) {
  const fromCtx = readCartItemsFromContext(cartCtx).map(normalizeCartItem);
  const fromLS = readCartItemsFromStorage().map(normalizeCartItem);
  const merged = mergeItemsByName([...fromCtx, ...fromLS]).filter((x) => x.name);
  const parts = merged.map((x) => (x.qty && x.qty !== 1 ? `${x.name} x${x.qty}` : x.name));
  const fullSummary = parts.join(", ");
  return { parts, fullSummary, count: parts.length, items: merged };
}

function makeUiLines(parts, { perItemMax = 36, maxLines = 3 } = {}) {
  const trunc = (s) => (s.length > perItemMax ? s.slice(0, perItemMax - 1) + "…" : s);
  const uiLines = parts.slice(0, maxLines).map(trunc);
  const remaining = Math.max(parts.length - maxLines, 0);
  return { uiLines, remaining };
}

function formatDateTime(d) {
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function BrandIcon({ brand }) {
  const b = String(brand || "").toLowerCase();
  const style = { width: 28, height: 18 };
  if (b.includes("visa"))
    return (
      <svg viewBox="0 0 64 40" style={style} aria-label="Visa">
        <rect width="64" height="40" rx="4" fill="#1A1F71" />
        <text x="12" y="26" fill="#fff" fontSize="18" fontFamily="Arial" fontWeight="bold">
          VISA
        </text>
      </svg>
    );
  if (b.includes("master"))
    return (
      <svg viewBox="0 0 64 40" style={style} aria-label="Mastercard">
        <rect width="64" height="40" rx="4" fill="#000" />
        <circle cx="26" cy="20" r="10" fill="#EB001B" />
        <circle cx="38" cy="20" r="10" fill="#F79E1B" />
      </svg>
    );
  if (b.includes("amex") || b.includes("american"))
    return (
      <svg viewBox="0 0 64 40" style={style} aria-label="Amex">
        <rect width="64" height="40" rx="4" fill="#2E77BC" />
        <text x="10" y="26" fill="#fff" fontSize="14" fontFamily="Arial" fontWeight="bold">
          AMEX
        </text>
      </svg>
    );
  if (b.includes("discover"))
    return (
      <svg viewBox="0 0 64 40" style={style} aria-label="Discover">
        <rect width="64" height="40" rx="4" fill="#fff" stroke="#ccc" />
        <circle cx="40" cy="20" r="9" fill="#F47216" />
        <text x="8" y="25" fill="#111" fontSize="12" fontFamily="Arial" fontWeight="bold">
          DISCOVER
        </text>
      </svg>
    );
  if (b.includes("jcb"))
    return (
      <svg viewBox="0 0 64 40" style={style} aria-label="JCB">
        <rect width="64" height="40" rx="4" fill="#fff" stroke="#ccc" />
        <rect x="10" y="8" width="12" height="24" fill="#006633" />
        <rect x="22" y="8" width="12" height="24" fill="#0B4EA2" />
        <rect x="34" y="8" width="12" height="24" fill="#E60012" />
      </svg>
    );
  if (b.includes("union"))
    return (
      <svg viewBox="0 0 64 40" style={style} aria-label="UnionPay">
        <rect width="64" height="40" rx="4" fill="#fff" stroke="#ccc" />
        <rect x="10" y="8" width="15" height="24" fill="#017F7F" />
        <rect x="25" y="8" width="15" height="24" fill="#D81E06" />
        <rect x="40" y="8" width="15" height="24" fill="#003A8C" />
      </svg>
    );
  
  return (
    <svg viewBox="0 0 64 40" style={style} aria-label="Card">
      <rect width="64" height="40" rx="4" fill="#2563EB" />
      <rect x="8" y="10" width="10" height="6" rx="1" fill="#93C5FD" />
      <rect x="8" y="24" width="28" height="4" rx="2" fill="#3B82F6" />
    </svg>
  );
}


export default function PaymentPage() {
  const cartCtx = useCart();
  const clearCart = cartCtx?.clearCart ?? (() => {});
  const stripe = useStripe();
  const elements = useElements();

  const inputBase =
    "block w-full h-12 border rounded-md bg-white px-3 pr-12 outline-none focus:ring-2";
  const inputCls = (hasError) =>
    `${inputBase} ${
      hasError ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"
    }`;

  const elementOptions = {
    style: {
      base: { fontSize: "16px", color: "#111827", "::placeholder": { color: "#9CA3AF" } },
      invalid: { color: "#DC2626" },
    },
    showIcon: true,
  };

  const location = useLocation();
  const [step, setStep] = useState(
    () => location.state?.step || new URLSearchParams(location.search).get("step") || "form"
  );
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get("mode") || "add");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (location.state?.step) setStep(location.state.step);
  }, [location.state]);

  
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", step);
    url.searchParams.set("mode", mode);
    const has = (k) => !!url.searchParams.get(k);
    const s = location.state || {};
    if (s.source && !has("source")) url.searchParams.set("source", String(s.source));
    if (s.amount != null && !has("total"))
      url.searchParams.set("total", String(Math.round(Number(s.amount) || 0)));
    if (s.ref && !has("ref")) url.searchParams.set("ref", String(s.ref));
    if (s.service && !has("service")) url.searchParams.set("service", String(s.service));
    window.history.replaceState({ ...(window.history.state || {}), step, mode }, "", url.toString());
  }, [step, mode, location.state]);

  useEffect(() => {
    const onPop = () => {
      const s = new URLSearchParams(window.location.search);
      setStep(s.get("step") || "form");
      setMode(s.get("mode") || "add");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("total");
    const c = params.get("currency");
    if (t != null) localStorage.setItem("vms:total", t);
    if (c) localStorage.setItem("vms:currency", c.toUpperCase());
  }, []);

  
  const { amount, source, ref } = useMemo(() => {
    if (location.state?.amount != null) {
      return {
        amount: Math.round(Number(location.state.amount) || 0),
        source: (location.state.source || "").toString().trim().toLowerCase() || "unknown",
        ref: (location.state.ref || "").toString().trim() || null,
      };
    }
    const params = new URLSearchParams(window.location.search);
    const readNum = (v) => {
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    const urlTotal = readNum(params.get("total"));
    const lsTotal = readNum(localStorage.getItem("vms:total"));
    const amt = Math.round(urlTotal ?? lsTotal ?? 0);

    const urlSource = (params.get("source") || "").toString().trim().toLowerCase();
    const urlRef = (params.get("ref") || "").toString().trim();
    const stateSource = (location.state?.source || "").toString().trim().toLowerCase();

    let resolvedSource = stateSource || urlSource;
    if (!resolvedSource) {
      const appointmentId = params.get("appointmentId");
      const urlPurpose = (params.get("purpose") || "").toString().trim().toLowerCase();
      if ((/^APPT-\d{6}$/i.test(urlRef) || /^[a-f0-9]{24}$/i.test(urlRef)) && appointmentId) {
        resolvedSource = "hospital";
      } else if (urlPurpose.includes("mart")) {
        resolvedSource = "mart";
      }
    }
    return { amount: amt, source: resolvedSource || "unknown", ref: urlRef || null };
  }, [location.state]);


  const service = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const svc =
      location.state?.service ||
      location.state?.serviceName ||
      location.state?.selectedService ||
      params.get("service") ||
      params.get("serviceName") ||
      params.get("selectedService") ||
      "";
    if (svc) return svc;
    if (source === "hospital") return location.state?.description || params.get("description") || "";
    return "";
  }, [location.state, source]);

  
  const martPurpose = useMemo(() => {
    if (source !== "mart") return null;
    const data = buildMartPurposeData({ cartCtx });
    const ui = makeUiLines(data.parts, { perItemMax: 36, maxLines: 3 });
    return { ...data, ...ui };
  }, [source, cartCtx]);

  const hospitalPurposeText = useMemo(() => {
    const svc = service ? titleCase(service) : "";
    return svc ? `Hospital - ${svc}` : "Hospital";
  }, [service]);

  const formattedTotal = useMemo(() => formatLKR(amount), [amount]);

  
  const [savedCards, setSavedCards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const MAX_CARDS = 3;
  const atLimit = savedCards.length >= MAX_CARDS;

  const [flash, setFlash] = useState("");
  const [cardError, setCardError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  
  const [expiryRaw, setExpiryRaw] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [errors, setErrors] = useState({
    cardNumber: null,
    expiry: null,
    cvv: null,
    nameOnCard: null,
  });
  const [elStatus, setElStatus] = useState({
    cardNumber: { complete: false, error: "" },
    expiry: { complete: false, error: "" },
    cvv: { complete: false, error: "" },
  });

  
  const [paidAt, setPaidAt] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [displayRef, setDisplayRef] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [successPurposeText, setSuccessPurposeText] = useState(null);
  const [successMartUi, setSuccessMartUi] = useState(null);
  const [successMartItems, setSuccessMartItems] = useState(null);
  const [successDelivery, setSuccessDelivery] = useState(null);
  const [lastPaymentRes, setLastPaymentRes] = useState(null);
  // Store appointment details for invoice generation
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  
  useEffect(() => {
    // Store appointment details from location state
    if (location.state?.appointment) {
      setAppointmentDetails(location.state.appointment);
    }
  }, [location.state]);
  
  useEffect(() => {
    (async () => {
      try {
        const { data } = await paymentBaseURL.get("/payment-methods");
        setSavedCards(
          data.map((card) => ({
            id: card.pmId || card.id,
            last4: card.last4,
            name: card.billing_name || card.billing_details?.name || "",
            brand: card.brand,
            expMonth: card.exp_month,
            expYear: card.exp_year,
            expiryDisplay:
              card.exp_month && card.exp_year
                ? `${String(card.exp_month).padStart(2, "0")}/${String(card.exp_year).length === 2 ? `20${card.exp_year}` : String(card.exp_year)}`
                : "—",
          }))
        );
      } catch {
        setCardError("Failed to load saved cards");
      }
    })();
  }, []);

  
  useEffect(() => {
    try {
      const urlSnap = readDeliveryFromQuery();
      const { delivery: helperSnap } = getSelectedAddressInfo();
      const best = bestDeliverySnapshot(urlSnap, helperSnap);
      if (best) setInvoiceSnapshotIfBetter(best);
    } catch {}
    
    try {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("selectedAddressId");
      if (sid) {
        localStorage.setItem("address:selected_id", sid);
        localStorage.setItem("vms:selectedAddressId", sid);
      }
    } catch {}
  }, []);


  const isDigit = (k) => /^[0-9]$/.test(k);
  const formatExpiry = (raw) => {
    if (raw.length === 0) return "";
    if (raw.length === 1) return raw;
    const mm = raw.slice(0, 2);
    return raw.length > 2 ? `${mm}/${raw.slice(2, 4)}` : `${mm}/`;
  };
  const insertDigit = (raw, d) => {
    if (raw.length >= 4) return raw;
    if (raw.length === 0) {
      if (d === "0" || d === "1") return d;
      if (d >= "2" && d <= "9") return "0" + d;
      return raw;
    }
    if (raw.length === 1) {
      const first = raw[0];
      if (first === "0") return d >= "1" && d <= "9" ? "0" + d : raw;
      if (first === "1") return ["0", "1", "2"].includes(d) ? "1" + d : raw;
      return raw;
    }
    if (raw.length === 2) return d >= "0" && d <= "9" ? raw + d : raw;
    if (raw.length === 3) return d >= "0" && d <= "9" ? raw + d : raw;
    return raw;
  };
  const isExpiryValid = (mm, yyyy) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (yyyy < currentYear) return false;
    if (yyyy === currentYear && mm < currentMonth) return false;
    if (mm < 1 || mm > 12) return false;
    return true;
  };

  useEffect(() => {
    if (expiryRaw.length === 4) {
      const mm = Number(expiryRaw.slice(0, 2));
      const yy = Number(expiryRaw.slice(2, 4));
      const yyyy = 2000 + yy;
      if (!isExpiryValid(mm, yyyy)) {
        setErrors((er) => ({ ...er, expiry: "Expiry date is in the past." }));
      } else {
        setErrors((er) => ({ ...er, expiry: null }));
      }
    } else if (errors.expiry) {
      setErrors((er) => ({ ...er, expiry: null }));
    }
    
  }, [expiryRaw]);

  const handleElChange = (field) => (ev) => {
    setElStatus((s) => ({
      ...s,
      [field]: { complete: ev.complete, error: ev.error?.message || "" },
    }));
    if (ev.complete) {
      setErrors((er) => ({ ...er, [field]: null }));
    } else if (ev.error?.message) {
      setErrors((er) => ({ ...er, [field]: ev.error.message }));
    }
  };

  const isNameValid = () => nameOnCard.trim().length > 0;
  function handleExpiryKeyDown(e) {
    const k = e.key;
    const navKeys = ["Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
    if (navKeys.includes(k)) return;
    if (k === "/" || k === " " || k === "-") {
      e.preventDefault();
      return;
    }
    if (k === "Backspace") {
      e.preventDefault();
      setExpiryRaw((r) => r.slice(0, -1));
      if (errors.expiry) setErrors((er) => ({ ...er, expiry: null }));
      return;
    }
    if (isDigit(k)) {
      e.preventDefault();
      const next = insertDigit(expiryRaw, k);
      setExpiryRaw(next);
      if (errors.expiry && next.length === 4) setErrors((er) => ({ ...er, expiry: null }));
      return;
    }
    e.preventDefault();
  }
  function handleExpiryPaste(e) {
    e.preventDefault();
    const txt = (e.clipboardData || window.clipboardData).getData("text") || "";
    const digits = txt.replace(/\D/g, "").slice(0, 4);
    if (!digits) return;
    let cur = expiryRaw;
    for (const ch of digits) {
      const next = insertDigit(cur, ch);
      if (next === cur) break;
      cur = next;
      if (cur.length >= 4) break;
    }
    setExpiryRaw(cur);
    if (errors.expiry && cur.length === 4) setErrors((er) => ({ ...er, expiry: null }));
  }

  function resetForm() {
    setNameOnCard("");
    setExpiryRaw("");
    setErrors({ cardNumber: null, expiry: null, cvv: null, nameOnCard: null });
    setElStatus({
      cardNumber: { complete: false, error: "" },
      expiry: { complete: false, error: "" },
      cvv: { complete: false, error: "" },
    });
    setCardError(null);
  }

  
  function clearCartAfterPayment() {
    try { clearCart(); } catch {}
    try { paymentBaseURL.post("/cart/clear").catch(() => {}); } catch {}
    try {
      const keys = ["cart", "cartItems", "cart_count", "cartCount"];
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem("cart:version", String(Date.now()));
    } catch {}
    try { window.dispatchEvent(new CustomEvent("cart:changed", { detail: { count: 0 } })); } catch {}
  }

  
  async function handleUsePayment() {
    setCardError(null);

    if (!selectedId) {
      setCardError("Please select a payment method");
      return;
    }
    if (!amount || amount <= 0) {
      setCardError("Invalid payment amount");
      return;
    }

    const amountLkr = Math.round(Number(amount || 0));
    if (!Number.isFinite(amountLkr) || amountLkr < 1) {
      setCardError("Amount must be at least LKR 1");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const appointmentId = params.get("appointmentId");
    const isHospitalFlow =
      source === "hospital" || !!appointmentId || !!(service || "").trim();
    const payloadSource = isHospitalFlow ? "hospital" : "mart";

    
    let payloadDescription = "";
    let deliverySnapshotForSuccess = null;

    if (isHospitalFlow) {
      payloadDescription = service ? String(service) : "Hospital appointment payment";
      setSuccessPurposeText(hospitalPurposeText);
      setSuccessMartUi(null);
      setSuccessMartItems(null);
      setSuccessDelivery(null);
    } else {
      const dataSnap = buildMartPurposeData({ cartCtx });
      const uiSnap = makeUiLines(dataSnap.parts, { perItemMax: 36, maxLines: 3 });
      payloadDescription = dataSnap.fullSummary || "Mart purchase payment";
      setSuccessPurposeText(dataSnap.fullSummary || "Mart");
      setSuccessMartUi({ uiLines: uiSnap.uiLines, remaining: uiSnap.remaining });
      setSuccessMartItems(dataSnap.items || []);
    }

  
    const paymentData = {
      amount_lkr: amountLkr,
      currency: "lkr",
      payment_method: selectedId,
      source: payloadSource,
      ref_id: ref || "",
      description: payloadDescription,
    };

    
    if (payloadSource === "mart") {
      const userId = resolveUserId();
      const { addressId: selectedAddressId, delivery: deliverySnapshotLS } = getSelectedAddressInfo();

      let finalSnapshot =
        readDeliveryFromQuery() || 
        deliverySnapshotLS ||      
        null;

      
      if (!finalSnapshot && selectedAddressId) {
        finalSnapshot = await fetchAddressSnapshotById(selectedAddressId, userId);
      }

      
      if (!finalSnapshot) {
        finalSnapshot = await fetchFallbackAddressSnapshot(userId);
      }

      
      if (!finalSnapshot) {
        finalSnapshot = findAnyAddressInLocalStorage();
      }

      if (selectedAddressId) {
        paymentData.address_id = selectedAddressId;
        // Set both fields to ensure we catch it in both ways
        paymentData.delivery_address_id = selectedAddressId;
        console.log("Setting address ID for payment:", selectedAddressId);
      }

      if (finalSnapshot) {
        const norm = normalizeAddressSnapshot(finalSnapshot);
        paymentData.delivery = { ...norm };
        
        // If we have the address ID in the snapshot, ensure it's set
        if (finalSnapshot._id && !paymentData.address_id) {
          paymentData.address_id = finalSnapshot._id;
          paymentData.delivery_address_id = finalSnapshot._id;
          console.log("Setting address ID from snapshot:", finalSnapshot._id);
        }
        
        deliverySnapshotForSuccess = { ...norm };
        setSuccessDelivery({ ...norm });
        setInvoiceSnapshotIfBetter(norm);
      }
    }

    try {
      let { data: paymentRes } = await paymentBaseURL.post("/create-payment-intent", paymentData);
      setLastPaymentRes(paymentRes);

      if (paymentRes?.error) {
        setCardError(paymentRes.error);
        return;
      }

      
      const resDelivery = extractDeliveryFromAny(paymentRes);
      if (resDelivery) {
        const norm = normalizeAddressSnapshot(resDelivery);
        setSuccessDelivery(norm);
        setInvoiceSnapshotIfBetter(norm);
      }

      
      if (paymentRes?.requiresAction && paymentRes?.clientSecret) {
        if (!stripe) {
          setCardError("Stripe not ready. Try again.");
          return;
        }
        const result = await stripe.confirmCardPayment(paymentRes.clientSecret);
        if (result.error) {
          setCardError(result.error.message || "Payment authentication failed.");
          return;
        }
        const pi = result.paymentIntent;
        if (!pi || pi.status !== "succeeded") {
          setCardError("Payment not completed. Please try again.");
          return;
        }

        setPaidAt(new Date());
        setPaidAmount(formatLKR(paymentRes.amount_lkr ?? amountLkr));
        setDisplayRef(paymentRes.ref_id || ref || null);
        setPaymentIntentId(pi.id);

        try {
          const fetchedDelivery = await tryFetchDeliveryByRefOrPI({
            refId: (paymentRes?.ref_id || ref || "").trim(),
            piId: (pi?.id || "").trim(),
          });
          if (fetchedDelivery) {
            const norm = normalizeAddressSnapshot(fetchedDelivery);
            setSuccessDelivery(norm);
            setInvoiceSnapshotIfBetter(norm);
          } else if (!resDelivery && deliverySnapshotForSuccess) {
            setSuccessDelivery(deliverySnapshotForSuccess);
            setInvoiceSnapshotIfBetter(deliverySnapshotForSuccess);
          }
        } catch {}

        clearCartAfterPayment();

        
        try {
          const snap = window.__LAST_DELIVERY__ || deliverySnapshotForSuccess || readDeliveryFromQuery();
          if (snap) {
            const url = new URL(window.location.href);
            for (const [k, v] of Object.entries({
              firstName: snap.firstName,
              lastName: snap.lastName,
              phone: snap.phone,
              line1: snap.line1,
              line2: snap.line2,
              city: snap.city,
              state: snap.state,
              postalCode: snap.postalCode,
              country: snap.country || "Sri Lanka",
            })) {
              if (v) url.searchParams.set(k, String(v));
            }
            window.history.replaceState(window.history.state, "", url.toString());
          }
        } catch {}

        setStep("success");
        return;
      }

      
      if (!paymentRes?.success) {
        setCardError(paymentRes?.message || "Payment failed. Please try again.");
        return;
      }

      setPaidAt(new Date());
      setPaidAmount(formatLKR(paymentRes.amount_lkr ?? amountLkr));
      setDisplayRef(paymentRes.ref_id || ref || null);
      setPaymentIntentId(paymentRes.paymentIntentId || null);

      try {
        const fetchedDelivery = await tryFetchDeliveryByRefOrPI({
          refId: (paymentRes?.ref_id || ref || "").trim(),
          piId: (paymentRes?.paymentIntentId || "").trim(),
        });
        if (fetchedDelivery) {
          const norm = normalizeAddressSnapshot(fetchedDelivery);
          setSuccessDelivery(norm);
          setInvoiceSnapshotIfBetter(norm);
        } else if (!resDelivery && deliverySnapshotForSuccess) {
          setSuccessDelivery(deliverySnapshotForSuccess);
          setInvoiceSnapshotIfBetter(deliverySnapshotForSuccess);
        }
      } catch {}

      clearCartAfterPayment();

      
      try {
        const snap = window.__LAST_DELIVERY__ || deliverySnapshotForSuccess || readDeliveryFromQuery();
        if (snap) {
          const url = new URL(window.location.href);
          for (const [k, v] of Object.entries({
            firstName: snap.firstName,
            lastName: snap.lastName,
            phone: snap.phone,
            line1: snap.line1,
            line2: snap.line2,
            city: snap.city,
            state: snap.state,
            postalCode: snap.postalCode,
            country: snap.country || "Sri Lanka",
          })) {
            if (v) url.searchParams.set(k, String(v));
          }
          window.history.replaceState(window.history.state, "", url.toString());
        }
      } catch {}

      setStep("success");
    } catch (error) {
      setCardError(
        error?.response?.data?.error || error?.message || "Payment failed. Please try again."
      );
      alert("API error: " + JSON.stringify(error?.response?.data || error?.message || error));
    }
  }

  
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  async function tryGetPdf(path, config) {
    try {
      const res = await paymentBaseURL.get(path, { responseType: "blob", ...(config || {}) });
      const ct = res?.headers?.["content-type"] || "";
      if (!res?.data) throw new Error("No data");
      if (ct.includes("application/pdf") || ct.includes("octet-stream")) return res.data;
      try { await res.data.text(); } catch {}
      throw new Error("Not a PDF");
    } catch (e) {
      console.debug("Invoice GET failed:", path, e?.message || e);
      throw e;
    }
  }

  async function tryPostPdf(path, body) {
    try {
      const res = await paymentBaseURL.post(path, body, { responseType: "blob" });
      const ct = res?.headers?.["content-type"] || "";
      if (!res?.data) throw new Error("No data");
      if (ct.includes("application/pdf") || ct.includes("octet-stream")) return res.data;
      try { await res.data.text(); } catch {}
      throw new Error("Not a PDF");
    } catch (e) {
      console.debug("Invoice POST failed:", path, e?.message || e);
      throw e;
    }
  }

  
  // Helper function to score address snapshots based on completeness
  function scoreDelivery(snapshot) {
    if (!snapshot) return 0;
    let score = 0;
    
    // Basic fields
    if (snapshot.firstName) score += 1;
    if (snapshot.lastName) score += 1;
    if (snapshot.phone) score += 2;
    
    // Address fields
    if (snapshot.line1) score += 3;
    if (snapshot.line2) score += 1;
    if (snapshot.city) score += 2;
    if (snapshot.state) score += 1;
    if (snapshot.postalCode) score += 1;
    if (snapshot.country) score += 1;
    
    return score;
  }
  
  // Store the best invoice snapshot in localStorage
  function setInvoiceSnapshotIfBetter(snapshot) {
    if (!snapshot) return;
    
    try {
      const existing = localStorage.getItem(LS_INVOICE_DELIVERY);
      if (existing) {
        const parsed = JSON.parse(existing);
        const normalized = normalizeAddressSnapshot(parsed);
        const existingScore = scoreDelivery(normalized);
        const newScore = scoreDelivery(snapshot);
        
        if (newScore <= existingScore) return; // Keep existing if it's better
      }
      
      localStorage.setItem(LS_INVOICE_DELIVERY, JSON.stringify(snapshot));
      if (typeof window !== 'undefined') window.__LAST_DELIVERY__ = snapshot;
    } catch (err) {
      console.debug("Failed to save invoice snapshot:", err);
    }
  }
  
  // Find any address-like object in localStorage
  function findAnyAddressInLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    
    const addressKeys = [
      "selectedAddress",
      "mart:selectedAddress", 
      "address:selected_json",
      "deliveryAddress",
      "shippingAddress",
      "billingAddress",
      "lastUsedAddress",
      "userAddress",
      "defaultAddress",
    ];
    
    for (const key of addressKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        
        const parsed = JSON.parse(raw);
        const normalized = normalizeAddressSnapshot(parsed);
        if (normalized) return normalized;
      } catch {}
    }
    
    return null;
  }
  
  // Try to fetch delivery information from the server by ref ID or payment intent ID
  async function tryFetchDeliveryByRefOrPI({ refId, piId }) {
    if (!refId && !piId) return null;
    
    try {
      // Try to get payment details which might contain address info
      const params = {};
      if (refId) params.ref_id = refId;
      if (piId) params.payment_intent_id = piId;
      
      const { data } = await paymentBaseURL.get("/payments/details", { params });
      if (!data) return null;
      
      // Extract delivery from the payment data
      return extractDeliveryFromAny(data);
    } catch (err) {
      console.debug("Failed to fetch delivery by ref/pi:", err);
      return null;
    }
  }
  
  // Using the existing joinAddressParts function defined at the top of the file

  // Choose the best delivery snapshot from multiple sources
  function bestDeliverySnapshot(...snapshots) {
    let best = null;
    let bestScore = -1;
    
    for (const snapshot of snapshots) {
      if (!snapshot) continue;
      const normalized = normalizeAddressSnapshot(snapshot);
      if (!normalized) continue;
      
      const score = scoreDelivery(normalized);
      if (score > bestScore) {
        best = normalized;
        bestScore = score;
      }
    }
    
    return best;
  }

  async function resolveDeliverySnapshotNow({ refId, piId }) {
    
    const fromState = successDelivery || null;
    const fromApiEcho = lastPaymentRes ? extractDeliveryFromAny(lastPaymentRes) : null;

    let fromLS = null;
    try {
      const raw = localStorage.getItem(LS_INVOICE_DELIVERY);
      if (raw) fromLS = JSON.parse(raw);
    } catch {}

    const fromMem = typeof window !== "undefined" ? window.__LAST_DELIVERY__ : null;
    const fromUrl = readDeliveryFromQuery();
    const fromHelper = getSelectedAddressInfo().delivery || null;
    const fromDeep = findAnyAddressInLocalStorage();

    
    let fromId = null;
    try {
      const { addressId } = getSelectedAddressInfo();
      if (addressId) fromId = await fetchAddressSnapshotById(addressId, resolveUserId());
    } catch {}
    const fromNewest = await fetchFallbackAddressSnapshot(resolveUserId());

    
    let fromServer = null;
    if (refId || piId) {
      try {
        fromServer = await tryFetchDeliveryByRefOrPI({ refId, piId });
      } catch {}
    }

    const best = bestDeliverySnapshot(
      fromState,
      fromApiEcho,
      fromLS,
      fromMem,
      fromUrl,
      fromHelper,
      fromDeep,
      fromId,
      fromNewest,
      fromServer
    );

    if (best) setInvoiceSnapshotIfBetter(best);
    
    // Return the best delivery snapshot
    return best;
    return best;
  }

  
  async function generateClientInvoicePdf({ refId, piId, deliveryOverride }) {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4"); 
      const page = { left: 20, right: 190, top: 20, width: 170 };

      
      const bandH = 36;
      doc.setFillColor(245, 158, 11); 
      doc.rect(0, 0, 210, bandH, "F");

      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(APP_NAME, page.left, 14);
      doc.setFontSize(10);
      doc.text(APP_URL, page.left, 20);

      const issued = formatDateTime(paidAt || new Date());
      const refLine = refId || piId || "-";

      
      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("INVOICE", page.right, 12, { align: "right" });
      doc.setFont(undefined, "normal");
      doc.setFontSize(11);
      doc.text(`Invoice No: ${refLine}`, page.right, 18, { align: "right" });
      doc.text(`Issued: ${issued}`, page.right, 24, { align: "right" });

      
      doc.setTextColor(33, 37, 41);
      let y = bandH + 8;

      
      const cardH = 30;
      const gap = 10;
      const amountCardW = 85;
      const infoCardX = page.left + amountCardW + gap;
      const infoCardW = page.right - infoCardX;

      
      doc.setDrawColor(210);
      if (doc.roundedRect) doc.roundedRect(page.left, y, amountCardW, cardH, 3, 3);
      else doc.rect(page.left, y, amountCardW, cardH);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Amount Paid", page.left + 6, y + 9);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text(`${paidAmount || formattedTotal}`, page.left + 6, y + 23);
      doc.setFont(undefined, "normal");

    
      doc.setDrawColor(210);
      if (doc.roundedRect) doc.roundedRect(infoCardX, y, infoCardW, cardH, 3, 3);
      else doc.rect(infoCardX, y, infoCardW, cardH);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Reference", infoCardX + 6, y + 9);
      doc.setTextColor(17, 24, 39);
      doc.setFont(undefined, "bold");
      doc.text(refLine, infoCardX + 6, y + 19);
      doc.setFont(undefined, "normal");
      doc.setTextColor(100);
      doc.text("Source", infoCardX + infoCardW - 6, y + 9, { align: "right" });
      doc.setTextColor(17, 24, 39);
      doc.setFont(undefined, "bold");
      doc.text((source || "-").toUpperCase(), infoCardX + infoCardW - 6, y + 19, { align: "right" });
      doc.setFont(undefined, "normal");

      y += cardH + 12;

    
if (source === "mart" && Array.isArray(successMartItems) && successMartItems.length) {
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Items", page.left, y);
  doc.setFont(undefined, "normal");
  y += 6;

  doc.setDrawColor(200);
  doc.line(page.left, y, page.right, y);
  y += 7;

  
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);

  
  const colLineTotalX = page.right;
  const colUnitPriceX = page.right - 35;
  const colQtyX = page.right - 70;       
  const nameColWidth = colQtyX - page.left - 4;

  doc.text("Item", page.left, y);
  doc.text("Qty", colQtyX, y, { align: "right" });
  doc.text("Unit Price", colUnitPriceX, y, { align: "right" });
  doc.text("Line Total", colLineTotalX, y, { align: "right" });
  y += 2;

  doc.setDrawColor(200);
  doc.line(page.left, y, page.right, y);
  y += 6;

  const bottomMargin = 265;
  doc.setTextColor(17, 24, 39);

  for (const it of successMartItems) {
    const lines = doc.splitTextToSize(String(it.name || ""), nameColWidth);
    const rowHeight = Math.max(6, lines.length * 5.5);

    
    if (y + rowHeight + 8 > bottomMargin) {
      doc.addPage();
      y = page.top;
    }

  
    doc.setFontSize(11);
    doc.text(lines, page.left, y);

    
    const qtyText = String(Number.isFinite(it.qty) ? it.qty : 1);
    doc.text(qtyText, colQtyX, y, { align: "right" });

    
    const unitText = Number.isFinite(it.unitPrice) ? formatLKR(it.unitPrice) : "—";
    doc.text(unitText, colUnitPriceX, y, { align: "right" });

    
    const lineTotal = Number.isFinite(it.lineTotal)
      ? it.lineTotal
      : (Number.isFinite(it.unitPrice) ? it.unitPrice * (Number(it.qty) || 1) : null);
    const totalText = Number.isFinite(lineTotal) ? formatLKR(lineTotal) : "—";
    doc.text(totalText, colLineTotalX, y, { align: "right" });

    
    y += rowHeight + 3;
    doc.setDrawColor(240);
    doc.line(page.left, y, page.right, y);
    y += 4;
  }
}

      
      let delivery = null;
      {
        let fromLS = null;
        try {
          const raw = localStorage.getItem(LS_INVOICE_DELIVERY);
          if (raw) fromLS = JSON.parse(raw);
        } catch {}
        const fromMem = typeof window !== "undefined" ? window.__LAST_DELIVERY__ : null;
        const fromUrl = readDeliveryFromQuery();
        const fromEcho = lastPaymentRes ? extractDeliveryFromAny(lastPaymentRes) : null;

        delivery = bestDeliverySnapshot(deliveryOverride, fromLS, fromMem, fromUrl, fromEcho);

        
        if (delivery) setInvoiceSnapshotIfBetter(delivery);
      }

      
      doc.setDrawColor(200);
      y += 6;
      doc.line(page.left, y, page.right, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Billing Details (Delivery)", page.left, y);
      doc.setFont(undefined, "normal");
      y += 6;

      const labelColor = [75, 85, 99];
      const valueColor = [17, 24, 39];

      const row = (label, value, wrap = false) => {
        doc.setFontSize(10);
        doc.setTextColor(...labelColor);
        doc.text(label, page.left, y);
        doc.setTextColor(...valueColor);
        if (!wrap) {
          doc.text(String(value || "—"), page.left + 50, y);
          y += 6;
        } else {
          const lines = doc.splitTextToSize(String(value || "—"), page.right - (page.left + 50));
          doc.text(lines, page.left + 50, y);
          y += Math.max(6, lines.length * 5.5);
        }
      };

      if (source === "mart") {
        // Use deliveryOverride if provided, otherwise fall back to delivery from state
        const deliveryData = deliveryOverride || delivery;
        const name = deliveryData ? `${(deliveryData.firstName || "").trim()} ${(deliveryData.lastName || "").trim()}`.trim() : "";
        const phone = deliveryData?.phone || "";
        const address = deliveryData ? joinAddressParts(deliveryData) : "";
        row("Recipient", name || "—");
        row("Phone", phone || "—");
        row("Address", address || "—", true);
      } else if (source === "hospital" && appointmentDetails) {
        // For hospital appointments, use the stored appointment information
        row("Patient Name", appointmentDetails.ownerName || "—");
        row("Pet Name", appointmentDetails.petName || "—");
        row("Pet Type", appointmentDetails.petType || "—");
        row("Service", appointmentDetails.service || "—");
        row("Veterinarian", appointmentDetails.vet || "—");
        row("Appointment Date", appointmentDetails.date || "—");
        row("Appointment Time", appointmentDetails.time || "—");
      } else if (source === "hospital") {
        // For hospital appointments without details, still show the service info
        row("Service", service || "Hospital Service");
        row("Date", formatDateTime(paidAt || new Date()));
        row("Reference", refLine || "—");
      } else {
        row("Recipient", "—");
        row("Phone", "—");
        row("Address", "—");
      }

      
      const pageH = doc.internal.pageSize.getHeight(); 
      const footerH = 28;
      const footerY = pageH - footerH;

      const notesBlockMin = 70;
      if (y + notesBlockMin > footerY - 6) {
        doc.addPage();
        y = page.top;
      }

      
      const barX = page.left;
      const barW = page.width - 15;
      const barH = 4;
      doc.setFillColor(250, 204, 21); 
      if (doc.roundedRect) doc.roundedRect(barX, y + 6, barW, barH, 2, 2, "F");
      else doc.rect(barX, y + 6, barW, barH, "F");

      
      y += 16;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("Notes", page.left, y);
      y += 6;
      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "This invoice acknowledges receipt of payment. For questions, contact support.",
        page.left,
        y
      );

      
      const wmY = Math.min(footerY - 35, Math.max(y + 45, 160));
      doc.setTextColor(249, 215, 76);
      doc.setFontSize(72);
      doc.setFont(undefined, "bold");
      doc.text("PAID", 105, wmY, { align: "center", angle: -28 });

      
      doc.setFillColor(241, 245, 249); 
      doc.rect(0, footerY, 210, footerH, "F");

      
      let fy = footerY + 10;
      doc.setTextColor(17, 24, 39);
      doc.setFont(undefined, "bold");
      doc.setFontSize(11);
      doc.text("PetIQ", page.left, fy);
      fy += 5;
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Sri Lanka", page.left, fy);
      fy += 5;
      doc.text(APP_URL, page.left, fy);
      fy += 5;
      doc.text("support@petiq.lk", page.left, fy);

      
      doc.setFont(undefined, "bold");
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.text("Thank you for choosing PetIQ!", page.right, footerY + 16, { align: "right" });

      
      let filename = `Invoice-${refLine}.pdf`;
      // For hospital appointments, include service in filename
      if (source === "hospital" && appointmentDetails?.service) {
        filename = `Invoice-${appointmentDetails.service.replace(/[^a-z0-9]/gi, '')}-${refLine}.pdf`;
      }
      doc.save(filename);
      return true;
    } catch (e) {
      console.debug("Client PDF generation failed:", e?.message || e);
      return false;
    }
  }

  async function downloadInvoice() {
    if (downloadingInvoice) return;
    const refId = (displayRef || ref || "").trim();
    const piId = (paymentIntentId || "").trim();

    if (!refId && !piId) {
      alert("Invoice not available for this payment yet. Please refresh and try again.");
      return;
    }

    setDownloadingInvoice(true);
    try {
      // Get the selected address ID
      const { addressId: selectedAddressId } = getSelectedAddressInfo();
      
      const deliveryNow = await resolveDeliverySnapshotNow({ refId, piId });

      // Generate client-side PDF for both mart and hospital sources
      if (source === "mart" || source === "hospital") {
        const ok = await generateClientInvoicePdf({ refId, piId, deliveryOverride: deliveryNow });
        if (ok) return;
      }

    
      let pdfBlob = null;
      const attempts = [];

      if (refId) {
        // Pass the selected address ID to the invoice endpoint
        attempts.push(() => tryGetPdf(`/payments/${encodeURIComponent(refId)}/invoice`, { 
          params: { deliveryAddressId: selectedAddressId } 
        }));
        attempts.push(() => tryGetPdf(`/invoice`, { 
          params: { ref_id: refId, deliveryAddressId: selectedAddressId } 
        }));
        attempts.push(() => tryGetPdf(`/payment/${encodeURIComponent(refId)}/invoice`, { 
          params: { deliveryAddressId: selectedAddressId } 
        }));
      }
      if (piId) {
        attempts.push(() => tryGetPdf(`/payments/${encodeURIComponent(piId)}/invoice`, { 
          params: { deliveryAddressId: selectedAddressId } 
        }));
        attempts.push(() => tryGetPdf(`/invoice`, { 
          params: { payment_intent_id: piId, deliveryAddressId: selectedAddressId } 
        }));
      }
      attempts.push(() =>
        tryPostPdf(`/invoice`, {
          ref_id: refId || undefined,
          payment_intent_id: piId || undefined,
          deliveryAddressId: selectedAddressId || undefined,
        })
      );

      for (const fn of attempts) {
        try {
          pdfBlob = await fn();
          if (pdfBlob) break;
        } catch {}
      }

      if (pdfBlob) {
        const safeRef = refId || piId || "payment";
        const filename = `Invoice-${safeRef}.pdf`;
        saveBlob(pdfBlob, filename);
        return;
      }

    
      const ok = await generateClientInvoicePdf({ refId, piId, deliveryOverride: deliveryNow });
      if (!ok) throw new Error("fallback_failed");
    } catch (e) {
      alert("Invoice could not be generated. Please contact support.");
    } finally {
      setDownloadingInvoice(false);
    }
  }

  
  async function onSubmit(e) {
    e.preventDefault();
    setCardError(null);

    if (mode === "add" && atLimit) {
      setStep("review");
      setFlash(`You can only save up to ${MAX_CARDS} cards.`);
      setTimeout(() => setFlash(""), 5000);
      return;
    }

    if (mode === "add") {
      const reqErrors = {
        nameOnCard: isNameValid() ? null : "Name on card is required.",
        cardNumber: elStatus.cardNumber.complete
          ? null
          : elStatus.cardNumber.error || "Card number is required.",
        expiry: elStatus.expiry.complete
          ? null
          : elStatus.expiry.error || "Expiry is required.",
        cvv: elStatus.cvv.complete ? null : elStatus.cvv.error || "CVV is required.",
      };
      setErrors((er) => ({ ...er, ...reqErrors }));
      if (Object.values(reqErrors).some(Boolean)) return;

      if (!stripe || !elements) {
        setCardError("Stripe is not ready yet. Please try again.");
        return;
      }

      try {
        setSaving(true);
        const { data: setupData } = await paymentBaseURL.post("/create-setup-intent");
        if (!setupData?.clientSecret) throw new Error(setupData?.error || "Couldn't start card save.");
        
        // Handle different response types
        let pmId;
        
        if (setupData.demoMode) {
          // Demo mode - skip actual Stripe API call
          console.log("Using demo mode for payment setup");
          pmId = setupData.demoPaymentMethodId;
        } else {
          // Normal flow with actual Stripe API
          const numberEl = elements.getElement(CardNumberElement);
          const { error, setupIntent } = await stripe.confirmCardSetup(setupData.clientSecret, {
            payment_method: {
              card: numberEl,
              billing_details: { name: nameOnCard.trim() },
            },
          });

          if (error) throw new Error(error.message || "Card details are invalid");
          if (!setupIntent?.payment_method) throw new Error("No payment method returned from Stripe");
          pmId = setupIntent.payment_method;
        }

        // pmId is now defined above
        const { data: pm } = await paymentBaseURL.get(`/payment-method/${pmId}`);

        const brand = pm?.brand || pm?.card?.brand || "";
        const last4 = pm?.last4 || pm?.card?.last4 || "••••";
        const expMonth = pm?.exp_month || pm?.card?.exp_month;
        const expYear = pm?.exp_year || pm?.card?.exp_year;

        setSavedCards((prev) => [
          ...prev,
          {
            id: pmId,
            last4,
            name: nameOnCard.trim(),
            brand,
            expMonth,
            expYear,
            expiryDisplay:
              expMonth && expYear
                ? `${String(expMonth).padStart(2, "0")}/${String(expYear).length === 2 ? `20${expYear}` : String(expYear)}`
                : "—",
          },
        ]);

        setSelectedId(null);
        setMode("add");
        setEditingId(null);
        resetForm();
        setStep("review");
      } catch (err) {
        setCardError(err?.message || "Something went wrong saving the card.");
      } finally {
        setSaving(false);
      }
      return;
    }

    
    const hasExpiry = expiryRaw.length === 4;
    const mm = Number(expiryRaw.slice(0, 2));
    const yy = Number(expiryRaw.slice(2, 4));
    const yyyy = 2000 + yy;
    const expiryValid = hasExpiry && isExpiryValid(mm, yyyy);

    const reqErrors = {
      expiry: expiryValid
        ? null
        : hasExpiry
        ? "Expiry date is in the past."
        : "Enter full expiry as MM/YY.",
      nameOnCard: isNameValid() ? null : "Name on card is required.",
      cardNumber: null,
      cvv: null,
    };
    setErrors((er) => ({ ...er, ...reqErrors }));
    if (Object.values(reqErrors).some(Boolean)) return;

    try {
      setSaving(true);
      const { data: updatedCard } = await paymentBaseURL.patch(`/payment-method/${editingId}`, {
        billing_details: { name: nameOnCard.trim() },
        exp_month: mm,
        exp_year: yyyy,
      });

      setSavedCards((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: updatedCard.billing_name || nameOnCard.trim(),
                expMonth: updatedCard.exp_month,
                expYear: updatedCard.exp_year,
                expiryDisplay:
                  updatedCard.exp_month && updatedCard.exp_year
                    ? `${String(updatedCard.exp_month).padStart(2, "0")}/${String(updatedCard.exp_year).length === 2 ? `20${updatedCard.exp_year}` : String(updatedCard.exp_year)}`
                    : c.expiryDisplay,
              }
            : c
        )
      );

      setStep("review");
      setMode("add");
      setEditingId(null);
      resetForm();
    } catch (e) {
      setCardError(e?.response?.data?.error || e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCard(id) {
    try {
      await paymentBaseURL.delete(`/payment-method/${id}`);
      setSavedCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
      setConfirmDeleteId(null);
    } catch (error) {
      setCardError(error?.response?.data?.error || "Failed to delete card");
    }
  }

  
  return (
    <div className="min-h-screen bg-white">
      <div className={`grid ${step === "success" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[2fr_1fr]"} min-h-screen`}>
        <div className={`p-8 lg:p-12 flex flex-col ${step === "success" ? "items-center justify-center" : ""}`}>
          
          {step === "form" && (
            <>
              <h2 className="text-2xl font-semibold">{mode === "edit" ? "Edit card" : "Add Credit or Debit Card"}</h2>
              <p className="text-gray-600 mt-3 mb-4">
                {mode === "edit"
                  ? "Update the card holder name or expiry date."
                  : "Provide a credit or debit card for future payments."}
              </p>

              {cardError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {cardError}
                </div>
              )}

              <form className="flex flex-col flex-1" noValidate onSubmit={onSubmit}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Card number</label>
                    <div className="relative">
                      {mode === "add" ? (
                        <div className={inputCls(!!errors.cardNumber) + " flex items-center"}>
                          <div className="w-full py-2">
                            <CardNumberElement options={elementOptions} onChange={handleElChange("cardNumber")} />
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className={`${inputCls(false)} bg-gray-50 cursor-not-allowed`}
                          value="Saved card"
                          disabled
                          readOnly
                        />
                      )}
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Exp MM/YY</label>
                      <div className="relative">
                        {mode === "add" ? (
                          <div className={inputCls(!!errors.expiry) + " flex items-center"}>
                            <div className="w-full py-2">
                              <CardExpiryElement options={elementOptions} onChange={handleElChange("expiry")} />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className={inputCls(!!errors.expiry)}
                            value={formatExpiry(expiryRaw)}
                            onKeyDown={handleExpiryKeyDown}
                            onPaste={handleExpiryPaste}
                            onChange={() => {}}
                            inputMode="numeric"
                            aria-invalid={!!errors.expiry}
                          />
                        )}
                      </div>
                      {errors.expiry && <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">CVV</label>
                      <div className="relative">
                        {mode === "add" ? (
                          <div className={inputCls(!!errors.cvv) + " flex items-center"}>
                            <div className="w-full py-2">
                              <CardCvcElement options={elementOptions} onChange={handleElChange("cvv")} />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="password"
                            placeholder="•••"
                            className={`${inputCls(false)} bg-gray-50 cursor-not-allowed`}
                            value="•••"
                            disabled
                            readOnly
                          />
                        )}
                      </div>
                      {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Name on card</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Name on card"
                        className={inputCls(!!errors.nameOnCard)}
                        value={nameOnCard}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\d/g, "");
                          setNameOnCard(v);
                          if (errors.nameOnCard && v.trim().length > 0) {
                            setErrors((er) => ({ ...er, nameOnCard: null }));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (/\d/.test(e.key)) e.preventDefault();
                        }}
                        aria-invalid={!!errors.nameOnCard}
                        inputMode="text"
                        autoCapitalize="words"
                        autoComplete="cc-name"
                      />
                    </div>
                    {errors.nameOnCard && <p className="mt-1 text-sm text-red-600">{errors.nameOnCard}</p>}
                  </div>
                </div>

                <div className="flex-1 flex items-center mt-6">
                  <div className="flex gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setMode("add");
                        setEditingId(null);
                        setStep("review");
                      }}
                      className="flex-1 border border-gray-400 py-3 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Save and continue"}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

        
          {step === "review" && (
            <>
              <h2 className="text-2xl font-semibold">Payment Method</h2>
              {flash && (
                <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
                  {flash}
                </div>
              )}
              <div className="mt-6 border rounded-lg border-gray-300">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Your Credit and Debit Cards</h3>
                </div>
                <div className="px-6 py-3 grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center text-sm text-gray-600">
                  <div>Card</div>
                  <div>Name on card</div>
                  <div className="text-right">Expires on</div>
                </div>
                <div className="pb-2 space-y-3">
                  {savedCards.map((card) => {
                    const selected = selectedId === card.id;
                    return (
                      <div
                        key={card.id}
                        className={`rounded-md px-6 py-4 border ${
                          selected ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-4">
                          <div className="flex items-center gap-3">
                            
                            <button
                              type="button"
                              onClick={() => setSelectedId((cur) => (cur === card.id ? null : card.id))}
                              aria-pressed={selected}
                              aria-label={selected ? "Unselect card" : "Select card"}
                              className={`h-4 w-4 rounded-full border ${
                                selected ? "border-blue-600" : "border-gray-400"
                              } flex items-center justify-center`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  selected ? "bg-blue-600" : "bg-transparent"
                                }`}
                              />
                            </button>

                            
                            <BrandIcon brand={card.brand} />

                            <div className="font-semibold">
                              {card.brand
                                ? `${card.brand.toUpperCase()} •••• ${card.last4}`
                                : `Card ending in ${card.last4}`}
                            </div>
                          </div>
                          <div className="text-gray-900">{card.name || "—"}</div>
                          <div className="text-gray-900 text-right">{card.expiryDisplay || "—"}</div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(null);
                              setMode("edit");
                              setEditingId(card.id);
                              setNameOnCard(card.name || "");
                              const mm = card.expMonth ? String(card.expMonth).padStart(2, "0") : "";
                              const yy = card.expYear ? String(card.expYear).slice(-2) : "";
                              setExpiryRaw(`${mm}${yy}`.slice(0, 4));
                              setStep("form");
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(card.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-6 pb-6">
                  {atLimit ? (
                    <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      You can only save up to {MAX_CARDS} cards.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("add");
                        setEditingId(null);
                        resetForm();
                        setStep("form");
                      }}
                      className="w-full text-left rounded-md border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center px-4 py-3">
                          <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600">
                            <circle cx="12" cy="12" r="10" fill="#DBEAFE" />
                            <path d="M12 7v10M7 12h10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </span>
                      
                        <svg viewBox="0 0 32 20" className="h-4 w-6">
                          <rect x="0" y="0" width="32" height="20" rx="3" fill="#2563EB" />
                          <rect x="4" y="4" width="8" height="6" rx="1" fill="#93C5FD" />
                          <rect x="4" y="12" width="18" height="3" rx="1.5" fill="#3B82F6" />
                        </svg>
                        <span className="text-blue-600">Add a credit or debit card</span>
                      </div>
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleUsePayment}
                disabled={!selectedId}
                aria-disabled={!selectedId}
                className={`mt-6 w-full rounded-full font-semibold py-3 ${
                  selectedId ? "bg-yellow-400 hover:bg-yellow-500 text-black" : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Use this payment method
              </button>
              {cardError && <p className="mt-4 text-sm text-red-600">{cardError}</p>}
            </>
          )}

        
          {step === "success" && (
            <div className="w-full flex items-center justify-center min-h-[70vh]">
              <div className="text-center">
                <svg viewBox="0 0 64 64" className="h-28 w-28 mx-auto block" aria-hidden="true">
                  <circle cx="32" cy="32" r="32" fill="#34D399" />
                  <path d="M18 34 L28 44 L46 24" fill="none" stroke="#ECFDF5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h1 className="mt-8 text-3xl font-semibold text-gray-900">Thank You!</h1>
                <p className="mt-3 text-gray-700">Payment completed successfully</p>
                <div className="mt-6 inline-block text-left border-2 border-gray-400 rounded-xl px-6 py-5 shadow-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-3 min-w-[380px]">
                    <div className="text-gray-700">Amount Paid:</div>
                    <div className="text-right font-semibold text-gray-900 text-lg sm:text-xl">
                      {paidAmount || formattedTotal}
                    </div>
                    <div className="text-gray-700">Purpose:</div>
                    <div className="text-right text-gray-900">
                      {source === "mart" ? (
                        <>
                          {successMartUi?.uiLines?.length ? (
                            <>
                              <ul className="inline-block text-right">
                                {successMartUi.uiLines.map((line, i) => (
                                  <li key={i} className="truncate max-w-[260px] sm:max-w-[300px]">
                                    {line}
                                  </li>
                                ))}
                              </ul>
                              {successMartUi.remaining > 0 && (
                                <div className="text-xs text-gray-500">+{successMartUi.remaining} more</div>
                              )}
                            </>
                          ) : (
                            <span className="capitalize">{successPurposeText || "Mart"}</span>
                          )}
                        </>
                      ) : (
                        <span className="capitalize">{hospitalPurposeText}</span>
                      )}
                    </div>
                    {(displayRef || ref) && (
                      <>
                        <div className="text-gray-700">Reference:</div>
                        <div className="text-right text-gray-900">{displayRef || ref}</div>
                      </>
                    )}
                    <div className="text-gray-700">Date &amp; Time:</div>
                    <div className="text-right text-gray-900 text-base sm:text-lg">
                      {formatDateTime(paidAt || new Date())}
                    </div>
                  </div>
                </div>

                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    downloadInvoice();
                  }}
                  className="mt-4 block text-yellow-600 hover:text-yellow-700 hover:underline font-medium"
                  aria-disabled={downloadingInvoice}
                >
                  {downloadingInvoice ? "Preparing invoice..." : "Download invoice (PDF)"}
                </a>

                <p className="mt-4 text-sm text-gray-500">Click below to return to the home page.</p>
                <button
                  type="button"
                  onClick={() => window.location.assign("/")}
                  className="mt-6 inline-flex items-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3"
                >
                  Home
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== "success" && (
          <div className="p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-gray-300">
            <div className="border border-gray-500 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="mt-8 flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formattedTotal}</span>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex justify-between items-start">
                  <span>Purpose</span>
                  <div className="font-medium text-gray-900 text-right">
                    {source === "mart" ? (
                      <>
                        <ul className="inline-block text-right">
                          {(martPurpose?.uiLines || []).map((line, i) => (
                            <li key={i} className="truncate max-w-[220px] sm:max-w-[260px]">
                              {line}
                            </li>
                          ))}
                        </ul>
                        {martPurpose?.remaining > 0 && (
                          <div className="text-xs text-gray-500">+{martPurpose.remaining} more</div>
                        )}
                      </>
                    ) : (
                      <span className="capitalize">{hospitalPurposeText}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-500">
                <path d="M9 3h6l1 2h5v2H3V5h5l1-2zM5 9h14l-1 11H6L5 9z" fill="currentColor" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-center">Delete Card?</h3>
            <p className="mt-2 text-center text-gray-600">
              Are you sure you want to delete your card ending in{" "}
              <span className="font-semibold">
                {savedCards.find((c) => c.id === confirmDeleteId)?.last4 || "••••"}
              </span>
              ?
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDeleteCard(confirmDeleteId)}
                className="rounded-full bg-red-500 py-3 text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-full border border-gray-300 bg-gray-100 py-3 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}