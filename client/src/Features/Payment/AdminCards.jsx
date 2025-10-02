
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";


export default function AdminCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/db/cards`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Unexpected server response");
      setCards(data);
    } catch (e) {
      setErr(e?.message || "Failed to load cards");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (s) => {
    try {
      const d = new Date(s);
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(d);
    } catch {
      return s || "—";
    }
  };

  const rows = useMemo(
    () =>
      cards.map((c) => ({
        id: c._id || c.pmId,
        brand: (c.brand || "").toUpperCase(),
        last4: c.last4 || "••••",
        exp:
          c.exp_month && c.exp_year
            ? `${String(c.exp_month).padStart(2, "0")}/${c.exp_year}`
            : "—",
        name: c.billing_name || "—",
        customer: c.stripe_customer || "—",
        pmId: c.pmId,
        updated: c.updatedAt || c.createdAt,
      })),
    [cards]
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Saved Cards</h1>
        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>


      {err && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {err}
        </div>
      )}

      <div className="mt-6 overflow-x-auto border rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">Updated</th>
              <th className="px-4 py-3 text-left">Card</th>
              <th className="px-4 py-3 text-left">Name on card</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Payment Method ID</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>
                  No cards saved yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmtDate(r.updated)}</td>
                  <td className="px-4 py-3 font-medium">
                    {r.brand ? `${r.brand} •••• ${r.last4}` : `•••• ${r.last4}`}
                  </td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.exp}</td>
                  <td className="px-4 py-3">{r.customer}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.pmId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
