import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";

export default function PaymentPage() {
  const stripe = useStripe();
  const elements = useElements();

  const API_BASE = "http://localhost:4242";
  const MAX_CARDS = 3;

  const inputBase =
    "block w-full h-12 border rounded-md bg-white px-3 pr-12 outline-none focus:ring-2";
  const inputCls = (hasError) =>
    `${inputBase} ${hasError ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"}`;

  const elementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#111827",
        "::placeholder": { color: "#9CA3AF" },
      },
      invalid: { color: "#DC2626" },
    },
    showIcon: true,
  };

  const formImages = ["/images/vmsp1.webp", "/images/vmsp2.webp", "/images/vmsp3.webp"];
  const reviewImages = ["/images/vmsp4.webp", "/images/vmsp5.webp", "/images/vmsp6.webp"];

  const [step, setStep] = useState(() => new URLSearchParams(window.location.search).get("step") || "review");
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get("mode") || "add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", step);
    url.searchParams.set("mode", mode);
    window.history.pushState({ step, mode }, "", url.toString());
  }, [step, mode]);
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
    const s = params.get("source");
    const r = params.get("ref");
    if (t != null) localStorage.setItem("vms:total", t);
    if (c) localStorage.setItem("vms:currency", c.toUpperCase());
    if (s) localStorage.setItem("vms:source", s);
    if (r) localStorage.setItem("vms:ref", r);
  }, []);

  const { amount, currency, source, ref } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const readNum = (v) => {
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };

    const urlTotal = readNum(params.get("total"));
    const urlCurrency = params.get("currency")?.toUpperCase();
    const lsTotal = readNum(localStorage.getItem("vms:total"));
    const lsCurrency = localStorage.getItem("vms:currency")?.toUpperCase();
    const amount = urlTotal ?? lsTotal ?? 0;

    let currency = /^[A-Z]{3}$/.test(urlCurrency || "") ? urlCurrency : lsCurrency || "USD";
    try {
      new Intl.NumberFormat(undefined, { style: "currency", currency }).format(1);
    } catch {
      currency = "USD";
    }

    const urlSource = params.get("source");
    const urlRef = params.get("ref");
    const lsSource = localStorage.getItem("vms:source");
    const lsRef = localStorage.getItem("vms:ref");

    const source = (urlSource || lsSource || "unknown").toString().trim();
    const ref = (urlRef || lsRef || "").toString().trim() || null;

    return { amount, currency, source, ref };
  }, []);

  const formattedTotal = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
    } catch {
      return `$${Number(amount || 0).toFixed(2)}`;
    }
  }, [amount, currency]);

  
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  
  const [elStatus, setElStatus] = useState({
    cardNumber: { complete: false, error: "" },
    expiry: { complete: false, error: "" },
    cvv: { complete: false, error: "" },
  });
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

  const [savedCards, setSavedCards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const atLimit = savedCards.length >= MAX_CARDS;

  const [flash, setFlash] = useState("");
  const [cardError, setCardError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [expiryRaw, setExpiryRaw] = useState(""); 
  const expiryRef = useRef(null);
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
      if (first === "1") return d === "0" || d === "1" || d === "2" ? "1" + d : raw;
      return raw;
    }
    if (raw.length === 2) return d >= "2" && d <= "9" ? raw + d : raw;
    if (raw.length === 3) {
      const y1 = raw[2];
      if (y1 === "2") return d >= "5" && d <= "9" ? raw + d : raw;
      return raw + d;
    }
    return raw;
  };

  const [errors, setErrors] = useState({
    cardNumber: null,
    expiry: null,
    cvv: null,
    nameOnCard: null,
  });

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

  const isNameValid = () => nameOnCard.trim().length > 0;

  function handleCardNumberChange(e) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 19);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(v);
  }
  function handleCvvChange(e) {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvv(v);
  }
  function handleNameOnCardChange(e) {
    const v = e.target.value.replace(/\d/g, "");
    setNameOnCard(v);
    if (errors.nameOnCard && v.trim().length > 0) {
      setErrors((er) => ({ ...er, nameOnCard: null }));
    }
  }
  function handleNameKeyDown(e) {
    if (/\d/.test(e.key)) e.preventDefault();
  }

  function resetForm() {
    setCardNumber("");
    setCvv("");
    setNameOnCard("");
    setExpiryRaw("");
    setErrors({ cardNumber: null, expiry: null, cvv: null, nameOnCard: null });
    setElStatus({ cardNumber: { complete: false, error: "" }, expiry: { complete: false, error: "" }, cvv: { complete: false, error: "" }});
    setCardError(null);
  }
  function focusCardNumber() {
    setTimeout(() => {
      const iframe = document.querySelector("iframe[name^='__privateStripeFrame']");
      iframe?.focus();
    }, 0);
  }

  const formatDisplayExpiry = (m, y) => {
    const mm = String(m).padStart(2, "0");
    const yyyy = String(y).length === 2 ? `20${String(y)}` : String(y);
    return `${mm}/${yyyy}`;
  };

  async function loadCards() {
    try {
      const res = await fetch(`${API_BASE}/api/payment-methods`);
      const list = await res.json();
      if (Array.isArray(list)) {
        const mapped = list.map((pm) => ({
          id: pm.id,
          last4: pm.last4,
          name: pm.billing_name || "—",
          brand: pm.brand || "",
          expMonth: pm.exp_month,
          expYear: pm.exp_year,
          expiryDisplay:
            pm.exp_month && pm.exp_year ? formatDisplayExpiry(pm.exp_month, pm.exp_year) : "—",
        }));
        setSavedCards(mapped);
      }
    } catch (e) {
      console.warn("Failed to load cards:", e.message);
    }
  }
  useEffect(() => {
    if (step === "review") loadCards();
  }, [step]);

  function startAdd() {
    setMode("add");
    setEditingId(null);
    resetForm();
    setStep("form");
    focusCardNumber();
  }
  function startEdit(card) {
    setMode("edit");
    setEditingId(card.id);
    setNameOnCard(card.name || "");
    const mm = card.expMonth ? String(card.expMonth).padStart(2, "0") : "";
    const yy = card.expYear ? String(card.expYear).slice(-2) : "";
    setExpiryRaw(`${mm}${yy}`.slice(0, 4));
    setCardNumber("");
    setCvv("");
    setErrors({ cardNumber: null, expiry: null, cvv: null, nameOnCard: null });
    setStep("form");
    setTimeout(() => {
      const el = document.querySelector("input[placeholder='Name on card']");
      el?.focus();
    }, 0);
  }
  async function handleDeleteCard(id) {
    try {
      const res = await fetch(`${API_BASE}/api/payment-method/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete on server");
      await loadCards();
      setSelectedId((cur) => (cur === id ? null : cur));
      setConfirmDeleteId(null);
    } catch (e) {
      alert(e?.message || "Failed to delete card");
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
      // Per-field validation for Elements + name
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

        const si = await fetch(`${API_BASE}/api/create-setup-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).then((r) => r.json());

        if (!si?.clientSecret) {
          setCardError(si?.error || "Couldn't start card save.");
          setSaving(false);
          return;
        }

        const numberEl = elements.getElement(CardNumberElement);
        const { error, setupIntent } = await stripe.confirmCardSetup(si.clientSecret, {
          payment_method: {
            card: numberEl,
            billing_details: { name: nameOnCard.trim() },
          },
        });

        if (error) {
          setCardError(error.message || "Card details invalid.");
          setSaving(false);
          return;
        }

        const pmId = setupIntent.payment_method;
        const pm = await fetch(`${API_BASE}/api/payment-method/${pmId}`).then((r) => r.json());

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
            expiryDisplay: expMonth && expYear ? formatDisplayExpiry(expMonth, expYear) : "—",
          },
        ]);

        setSelectedId(null);
        setMode("add");
        setEditingId(null);
        resetForm();
        setStep("review");

        loadCards();
      } catch (err) {
        setCardError(err?.message || "Something went wrong saving the card.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // EDIT mode
    const hasExpiry = expiryRaw.length === 4;
    const reqErrors = {
      expiry: hasExpiry ? null : "Enter full expiry as MM/YY.",
      nameOnCard: isNameValid() ? null : "Name on card is required.",
      cardNumber: null,
      cvv: null,
    };
    setErrors((er) => ({ ...er, ...reqErrors }));
    if (Object.values(reqErrors).some(Boolean)) return;

    try {
      setSaving(true);
      const mm = Number(expiryRaw.slice(0, 2));
      const yy = Number(expiryRaw.slice(2, 4));
      const yyyy = 2000 + yy;

      const res = await fetch(`${API_BASE}/api/payment-method/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameOnCard.trim(), exp_month: mm, exp_year: yyyy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update card");

      setSavedCards((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: data.billing_name || nameOnCard.trim(),
                expMonth: data.exp_month,
                expYear: data.exp_year,
                expiryDisplay:
                  data.exp_month && data.exp_year
                    ? formatDisplayExpiry(data.exp_month, data.exp_year)
                    : c.expiryDisplay,
              }
            : c
        )
      );

      setStep("review");
      setMode("add");
      setEditingId(null);
      resetForm();

      loadCards();
    } catch (e) {
      setCardError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // Image sliders
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const activeImages =
    step === "form" ? formImages : step === "review" ? reviewImages : [];
  useEffect(() => setCurrentImageIndex(0), [step]);
  useEffect(() => {
    if (!activeImages.length) return;
    const id = setInterval(() => {
      setCurrentImageIndex((i) => (i + 1) % activeImages.length);
    }, 3500);
    return () => clearInterval(id);
  }, [activeImages.length, step]);

  function toggleSelect(id) {
    setSelectedId((cur) => (cur === id ? null : id));
  }

  const [paidAt, setPaidAt] = useState(null);
  const [paidAmount, setPaidAmount] = useState("");
  const formatDateTime = (d) => {
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
  };

  async function handleUsePayment() {
    if (!selectedId) return;
    const cents = Math.round(Number(amount || 0) * 100);
    const description =
      source && source !== "unknown" ? `${source.toUpperCase()} ${ref || ""}`.trim() : undefined;

    const res = await fetch(`${API_BASE}/api/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: cents,
        currency,
        payment_method: selectedId,
        source,
        ref_id: ref,
        description,
      }),
    }).then((r) => r.json());

    if (res.error) {
      setCardError(res.error);
      return;
    }

    if (res.requiresAction && res.clientSecret) {
      if (!stripe) {
        setCardError("Stripe not ready. Try again.");
        return;
      }
      const result = await stripe.confirmCardPayment(res.clientSecret);
      if (result.error) {
        setCardError(result.error.message || "Payment authentication failed.");
        return;
      }
    }

    const finalAmount = res.amount ? res.amount / 100 : Number(amount || 0);
    setPaidAt(new Date());
    try {
      setPaidAmount(
        new Intl.NumberFormat(undefined, { style: "currency", currency }).format(finalAmount)
      );
    } catch {
      setPaidAmount(`$${finalAmount.toFixed(2)}`);
    }
    setStep("success");
  }

  // Icons
  const IconCardOutline = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <rect x="6.5" y="13" width="5" height="2.5" rx="0.5" />
    </svg>
  );
  const IconCalendarOutline = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18" />
      <path d="M8 3v3M16 3v3" />
    </svg>
  );
  const IconLockOutline = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="10" width="17" height="10.5" rx="2" />
      <path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" />
    </svg>
  );
  const IconIdCardOutline = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M7 13h6M7 16h8M15.5 9.5a1.75 1.75 0 1 1-3.5 0 1.75 1.75 0 0 1 3.5 0z" />
    </svg>
  );
  const IconMiniCardColor = (
    <svg viewBox="0 0 32 20" className="h-4 w-6">
      <rect x="0" y="0" width="32" height="20" rx="3" fill="#2563EB" />
      <rect x="4" y="4" width="8" height="6" rx="1" fill="#93C5FD" />
      <rect x="4" y="12" width="18" height="3" rx="1.5" fill="#3B82F6" />
    </svg>
  );
  const IconPlusCircle = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600">
      <circle cx="12" cy="12" r="10" fill="#DBEAFE" />
      <path d="M12 7v10M7 12h10" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  const IconSuccessCard = (
    <svg viewBox="0 0 64 64" className="h-28 w-28 mx-auto block" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="#34D399" />
      <path d="M18 34 L28 44 L46 24" fill="none" stroke="#ECFDF5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const gridCols = step === "success" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[2fr_1fr]";
  const editingCard = mode === "edit" ? savedCards.find((c) => c.id === editingId) : null;
  const maskedNumber = editingCard ? `${(editingCard.brand || "").toUpperCase()} •••• ${editingCard.last4}` : "";

  return (
    <div className="min-h-screen bg-white">
      <div className={`grid ${gridCols} min-h-screen`}>
        {/* LEFT */}
        <div className={`p-8 lg:p-12 flex flex-col ${step === "success" ? "items-center justify-center" : ""}`}>
          {step === "form" && (
            <>
              <h2 className="text-2xl font-semibold">
                {mode === "edit" ? "Edit card" : "Add Credit or Debit Card"}
              </h2>
              <p className="text-gray-600 mt-3 mb-4">
                {mode === "edit"
                  ? "Update the card holder name or expiry date."
                  : "Please provide a credit or debit card for future payments. This card will be set as the default payment method for your account."}
              </p>

              {/* form-level Stripe error */}
              {cardError && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {cardError}
                </div>
              )}

              <form className="flex flex-col flex-1" noValidate onSubmit={onSubmit}>
                <div className="space-y-6">
                  {/* Card number */}
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
                          value={maskedNumber}
                          disabled
                          readOnly
                        />
                      )}
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        {IconCardOutline}
                      </div>
                    </div>
                    {errors.cardNumber && <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>}
                  </div>

                  {/* Expiry + CVC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Expiry */}
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
                            ref={expiryRef}
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
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                          {IconCalendarOutline}
                        </div>
                      </div>
                      {errors.expiry && <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>}
                    </div>

                    {/* CVC */}
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
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                          {IconLockOutline}
                        </div>
                      </div>
                      {errors.cvv && <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>}
                    </div>
                  </div>

                  {/* Name on card */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Name on card</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Name on card"
                        className={inputCls(!!errors.nameOnCard)}
                        value={nameOnCard}
                        onChange={handleNameOnCardChange}
                        onKeyDown={handleNameKeyDown}
                        aria-invalid={!!errors.nameOnCard}
                        inputMode="text"
                        autoCapitalize="words"
                        autoComplete="cc-name"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        {IconIdCardOutline}
                      </div>
                    </div>
                    {errors.nameOnCard && <p className="mt-1 text-sm text-red-600">{errors.nameOnCard}</p>}
                  </div>
                </div>

                {/* Buttons */}
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
                              onClick={() => toggleSelect(card.id)}
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
                            {IconMiniCardColor}
                            <div className="font-semibold">
                              {card.brand ? `${card.brand.toUpperCase()} •••• ${card.last4}` : `Card ending in ${card.last4}`}
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
                              startEdit(card);
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
                      onClick={startAdd}
                      className="w-full text-left rounded-md border border-gray-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="inline-flex items-center justify-center">{IconPlusCircle}</span>
                        <span className="inline-flex items-center justify-center">{IconMiniCardColor}</span>
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
            </>
          )}

          {step === "success" && (
            <div className="w-full flex items-center justify-center min-h-[70vh]">
              <div className="text-center">
                {IconSuccessCard}
                <h1 className="mt-8 text-3xl font-semibold text-gray-900">Thank You!</h1>
                <p className="mt-3 text-gray-700">Payment done Successfully</p>

                <div className="mt-6 inline-block text-left border-2 border-gray-400 rounded-xl px-6 py-5 shadow-sm">
                  <div className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-3 min-w-[380px]">
                    <div className="text-gray-700">Amount Paid:</div>
                    <div className="text-right font-semibold text-gray-900 text-lg sm:text-xl">
                      {paidAmount || formattedTotal}
                    </div>

                    <div className="text-gray-700">Purpose:</div>
                    <div className="text-right text-gray-900 capitalize">{source}</div>

                    {ref && (
                      <>
                        <div className="text-gray-700">Reference:</div>
                        <div className="text-right text-gray-900">{ref}</div>
                      </>
                    )}

                    <div className="text-gray-700">Date &amp; Time:</div>
                    <div className="text-right text-gray-900 text-base sm:text-lg">
                      {formatDateTime(paidAt || new Date())}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-500">Click the button below to return to the home page.</p>
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

        {/* RIGHT (Summary + slider) */}
        {step !== "success" && (
          <div className="p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-gray-300">
            <div className="border border-gray-500 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              <div className="mt-8 flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>{formattedTotal}</span>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Purpose</span>
                  <span className="font-medium text-gray-900 capitalize">{source}</span>
                </div>
                {ref && (
                  <div className="flex justify-between mt-1">
                    <span>Reference</span>
                    <span className="font-medium text-gray-900">{ref}</span>
                  </div>
                )}
              </div>
            </div>

            {activeImages.length > 0 && (
              <div className="mt-8 relative h-[420px]">
                {activeImages.map((src, i) => (
                  <div
                    key={i}
                    className={`absolute w-full transition-opacity duration-1000 ease-in-out ${
                      currentImageIndex === i ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <img
                      src={src}
                      alt="Payment"
                      className="w-full max-w-sm mx-auto rounded-md"
                      style={{ height: "auto", maxHeight: "420px" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
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
              ? This action will permanently remove the card from your account.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-full border border-gray-300 bg-gray-100 py-3 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCard(confirmDeleteId)}
                className="rounded-full bg-red-500 py-3 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
