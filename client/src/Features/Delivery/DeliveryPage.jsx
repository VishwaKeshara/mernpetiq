
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4242";
const USER_ID = "guest"; 

const PROVINCES = [
  "Western","Central","Southern","Northern","Eastern",
  "North Western","North Central","Uva","Sabaragamuwa",
];

export default function DeliveryPage() {
  const navigate = useNavigate();

  
  const params = new URLSearchParams(window.location.search);
  const urlTotal = params.get("total");
  const urlCurrency = params.get("currency");
  const urlPurpose = params.get("source") || params.get("purpose");

  const ls = (k, v) =>
    v === undefined ? window.localStorage.getItem(k) : window.localStorage.setItem(k, v);

  const total = useMemo(() => {
    const t = urlTotal ?? ls("vms:total");
    return t ? Number(t) : 0;
  }, [urlTotal]);

  const currency = useMemo(
    () => (urlCurrency ?? ls("vms:currency") ?? "USD").toUpperCase(),
    [urlCurrency]
  );

  const purpose = useMemo(() => urlPurpose ?? ls("vms:source") ?? "Unknown", [urlPurpose]);

  const currencySymbol = (cur) => {
    const map = { USD: "$", EUR: "€", LKR: "Rs ", GBP: "£", INR: "₹", AUD: "A$", CAD: "C$" };
    return map[cur] || cur + " ";
  };

  
  const [addresses, setAddresses] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [selectedId, setSelectedId] = useState(() => ls("vms:selectedAddressId") || "");
  useEffect(() => ls("vms:selectedAddressId", selectedId || ""), [selectedId]);

  const MAX_ADDRESSES = 3;
  const atLimit = addresses.length >= MAX_ADDRESSES;

  async function loadAddresses() {
    setLoadingList(true);
    setListError("");
    try {
      const res = await fetch(`${API_BASE}/api/addresses?userId=${encodeURIComponent(USER_ID)}`);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
      if (selectedId && !data.find((a) => a._id === selectedId)) {
        setSelectedId("");
      }
    } catch (e) {
      setListError(e.message || "Failed to load addresses");
    } finally {
      setLoadingList(false);
    }
  }
  useEffect(() => {
    loadAddresses();
  }, []);

  
  const emptyForm = {
    firstName: "", lastName: "", phone: "",
    line1: "", line2: "", city: "", postalCode: "",
    state: "", country: "Sri Lanka",
  };
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverNotice, setServerNotice] = useState("");

  
  const [confirmDeleteId, setConfirmDeleteId] = useState("");

  const preventDigitsKey = (e) => {
    if (/\d/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
  };
  const setLettersOnly = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/[0-9]/g, "") }));
  const setDigitsOnly = (key, maxLen) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value.replace(/\D/g, "").slice(0, maxLen || 99) }));

  function openAdd() {
    if (atLimit) return;
    setEditingId("");
    setForm({ ...emptyForm });
    setErrors({});
    setShowForm(true);
  }
  function openEdit(id) {
    const a = addresses.find((x) => x._id === id);
    if (!a) return;
    setEditingId(id);
    setForm({
      firstName: a.firstName || "", lastName: a.lastName || "", phone: a.phone || "",
      line1: a.line1 || "", line2: a.line2 || "", city: a.city || "",
      postalCode: a.postalCode || "", state: a.state || "", country: a.country || "Sri Lanka",
    });
    setErrors({});
    setShowForm(true);
  }

  function validate(f) {
    const e = {};
    if (!f.firstName.trim()) e.firstName = "First name is required";
    if (!f.lastName.trim()) e.lastName = "Last name is required";
    if (/\d/.test(f.firstName)) e.firstName = "First name cannot contain numbers";
    if (/\d/.test(f.lastName)) e.lastName = "Last name cannot contain numbers";
    if (!f.phone.trim()) e.phone = "Phone is required";
    else if (f.phone.replace(/\D/g, "").length !== 10) e.phone = "Phone must be 10 digits";
    if (!f.line1.trim()) e.line1 = "Address line 1 is required";
    if (!f.city.trim()) e.city = "City is required";
    if (!f.state.trim()) e.state = "Province is required";
    if (f.postalCode && /\D/.test(f.postalCode)) e.postalCode = "Postal code must be numbers only";
    return e;
  }

  async function saveForm() {
    setServerNotice("");
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`${API_BASE}/api/addresses/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: USER_ID, ...form }),
        });
        if (res.status === 400) {
          const data = await res.json();
          setErrors(data.errors || {});
          return;
        }
        if (!res.ok) throw new Error(`Update failed (${res.status})`);
      } else {
        const res = await fetch(`${API_BASE}/api/addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: USER_ID, ...form }),
        });
        if (res.status === 409) {
          const data = await res.json();
          setServerNotice(data.message || "You can only add up to 3 delivery addresses.");
          return;
        }
        if (res.status === 400) {
          const data = await res.json();
          setErrors(data.errors || {});
          return;
        }
        if (!res.ok) throw new Error(`Create failed (${res.status})`);
      }
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      setServerNotice(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id) {
    try {
      const res = await fetch(
        `${API_BASE}/api/addresses/${id}?userId=${encodeURIComponent(USER_ID)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      if (selectedId === id) setSelectedId("");
      await loadAddresses();
    } catch (e) {
      alert(e.message || "Failed to delete");
    } finally {
      setConfirmDeleteId(""); 
    }
  }

  function onUseThisAddress() {
    if (!selectedId) return;
    ls("vms:selectedAddressId", selectedId);
    const qs = new URLSearchParams();
    qs.set("step", "review");
    if (total != null) qs.set("total", String(total));
    if (currency) qs.set("currency", currency);
    if (purpose) qs.set("source", purpose);
    const existingRef = params.get("ref") || ls("vms:ref");
    if (existingRef) qs.set("ref", existingRef);
    navigate("/?" + qs.toString());
  }

  const contactNameOf = (a) =>
    [a.firstName, a.lastName].filter(Boolean).join(" ").trim() || "—";

  const formatAddressOneLine = (a) =>
    [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(", ");

  // ---- slider under Summary
  const deliveryImages = ["/images/vmsp7.webp", "/images/vmsp8.webp"];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => setCurrentImageIndex(0), []);
  useEffect(() => {
    if (!deliveryImages.length) return;
    const id = setInterval(() => setCurrentImageIndex((i) => (i + 1) % deliveryImages.length), 3500);
    return () => clearInterval(id);
  }, [deliveryImages.length]);

  
  const TruckIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-800" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v7" />
      <path d="M14 11h4.5a2 2 0 0 1 1.6.8l1.4 1.9A2 2 0 0 1 22 15.2V16a2 2 0 0 1-2 2h-1" />
      <circle cx="8.5" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M3 9v7h3" />
    </svg>
  );
  const PencilIcon = (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-blue-600" fill="currentColor" aria-hidden="true">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.95 8.95A4 4 0 014 17H3v-1a4 4 0 011.172-2.828l8.95-8.95z" />
    </svg>
  );
  const TrashIcon = (
    <svg viewBox="0 0 20 20" className="h-5 w-5 text-red-600" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 100 2h.278l.823 9.052A4 4 0 009.09 19h1.82a4 4 0 003.99-3.948L15.722 6H16a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0010 2H9zM8 8a1 1 0 012 0v7a1 1 0 11-2 0V8zm5 0a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
    </svg>
  );

  const GRID_TEMPLATE =
    "grid grid-cols-[40px_minmax(0,2.2fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,0.6fr)] gap-x-6";

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] min-h-screen">
        
        <div className="p-8 lg:p-12 flex flex-col">
          <h2 className="text-2xl font-semibold">Delivery Details</h2>

          {serverNotice && (
            <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-800">
              {serverNotice}
            </div>
          )}
          {listError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {listError}
            </div>
          )}

          <div className="mt-6 border rounded-lg border-gray-300">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Your Delivery Details</h3>
            </div>

            
            <div className={`px-6 py-3 ${GRID_TEMPLATE} items-center text-sm text-gray-600`}>
              <div></div>
              <div>Address</div>
              <div>Contact</div>
              <div>Phone</div>
              <div></div>
            </div>

            
            <div className="pb-2 space-y-3">
              {loadingList ? (
                <div className="px-6 py-4 text-gray-500">Loading…</div>
              ) : (
                addresses.map((a) => {
                  const selected = selectedId === a._id;
                  return (
                    <div
                      key={a._id}
                      className={`rounded-md px-6 py-4 border ${
                        selected ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"
                      }`}
                    >
                      <div className={`${GRID_TEMPLATE} items-center`}>
                        {/* Radio */}
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => setSelectedId((cur) => (cur === a._id ? "" : a._id))}
                            aria-pressed={selected}
                            aria-label={selected ? "Unselect" : "Select"}
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
                        </div>

                        {/* Address */}
                        <div className="text-gray-900">{formatAddressOneLine(a)}</div>

                        {/* Contact */}
                        <div className="text-gray-900">{contactNameOf(a)}</div>

                        {/* Phone */}
                        <div className="text-gray-900 whitespace-nowrap">{a.phone}</div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => openEdit(a._id)}
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            {PencilIcon}
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => setConfirmDeleteId(a._id)} 
                            className="p-1 rounded hover:bg-gray-100"
                          >
                            {TrashIcon}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add row OR limit notice */}
            <div className="px-6 pb-6">
              {atLimit ? (
                <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  You can only add up to {MAX_ADDRESSES} delivery addresses.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openAdd}
                  className="w-full text-left rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-300 bg-white">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-700">
                        <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
                      </svg>
                    </span>
                    {TruckIcon}
                    <span className="text-emerald-800 font-medium">Add your delivery details</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onUseThisAddress}
            disabled={!selectedId}
            className={`mt-6 w-full rounded-full font-semibold py-3 ${
              selectedId
                ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Use this delivery address
          </button>
        </div>

        {/* RIGHT – Summary + slider */}
        <div className="p-8 lg:p-12 border-t lg:border-t-0 lg:border-l border-gray-300">
          <div className="border border-gray-500 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="mt-8 flex justify-between text-lg font-medium">
              <span>Total</span>
              <span>
                {currencySymbol(currency)}
                {Number.isFinite(total) ? total.toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Purpose</span>
                <span className="font-medium text-gray-900 capitalize">{purpose}</span>
              </div>
            </div>
          </div>

          {deliveryImages.length > 0 && (
            <div className="mt-8 relative h-[420px]">
              {deliveryImages.map((src, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    currentImageIndex === i ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={src}
                    alt="Delivery"
                    className="w-full max-w-sm mx-auto rounded-md"
                    style={{ height: "auto", maxHeight: "420px" }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-[92%] max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? "Edit delivery details" : "Add delivery details"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name" required error={errors.firstName}>
                <input
                  className={inputCls(!!errors.firstName)}
                  value={form.firstName}
                  onChange={setLettersOnly("firstName")}
                  onKeyDown={preventDigitsKey}
                  placeholder="First name"
                  inputMode="text"
                  autoCapitalize="words"
                />
              </Field>

              <Field label="Last name" required error={errors.lastName}>
                <input
                  className={inputCls(!!errors.lastName)}
                  value={form.lastName}
                  onChange={setLettersOnly("lastName")}
                  onKeyDown={preventDigitsKey}
                  placeholder="Last name"
                  inputMode="text"
                  autoCapitalize="words"
                />
              </Field>

              <Field label="Phone" required error={errors.phone}>
                <input
                  className={inputCls(!!errors.phone)}
                  value={form.phone}
                  onChange={setDigitsOnly("phone", 10)}
                  maxLength={10}
                  placeholder="07XXXXXXXX"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </Field>

              <Field label="Address line 1" required error={errors.line1} className="sm:col-span-2">
                <input
                  className={inputCls(!!errors.line1)}
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  placeholder="House No, Street"
                />
              </Field>

              <Field label="Address line 2 (optional)" className="sm:col-span-2">
                <input
                  className={inputCls(false)}
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  placeholder="Apartment, landmark"
                />
              </Field>

              <Field label="City" required error={errors.city}>
                <input
                  className={inputCls(!!errors.city)}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="City"
                />
              </Field>

              <Field label="Postal code" error={errors.postalCode}>
                <input
                  className={inputCls(!!errors.postalCode)}
                  value={form.postalCode}
                  onChange={setDigitsOnly("postalCode")}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Postal code"
                />
              </Field>

              <Field label="Province" required error={errors.state}>
                <select
                  className={inputCls(!!errors.state)}
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                >
                  <option value="">Select a province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field label="Country">
                <input
                  className={inputCls(false)}
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Country"
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-gray-300 bg-gray-100 px-5 py-2.5 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveForm}
                disabled={saving}
                className="rounded-full bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDeleteId("")} />
          <div className="relative z-10 w-[92%] max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-red-500">
                <path d="M9 3h6l1 2h5v2H3V5h5l1-2zM5 9h14l-1 11H6L5 9z" fill="currentColor" />
              </svg>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-center">Delete delivery details?</h3>
            <p className="mt-2 text-center text-gray-600">
              This will permanently remove the selected delivery address.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId("")}
                className="rounded-full border border-gray-300 bg-gray-100 py-3 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => removeAddress(confirmDeleteId)}
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


function Field({ label, required = false, error, className = "", children }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-sm font-medium text-gray-700">
        <span>{label}</span>
        {required && <span className="text-red-600"> *</span>}
      </div>
      {children}
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </label>
  );
}
function inputCls(hasError) {
  return `block w-full h-11 rounded-md border px-3 outline-none focus:ring-2 ${
    hasError ? "border-red-500 focus:ring-red-500" : "border-gray-400 focus:ring-blue-500"
  }`;
}
