import React, { useEffect, useMemo, useState } from "react";


export default function AdminPayments() {
  const API_BASE = "http://localhost:4242";

  
  const [source, setSource] = useState("any");
  const [refText, setRefText] = useState("");

  
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState("");

  
  const fmtAmount = (cents, currency) => {
    try {
      const n = (Number(cents || 0) / 100);
      return new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "usd").toUpperCase() }).format(n);
    } catch {
      const n = (Number(cents || 0) / 100).toFixed(2);
      return `${(currency || "USD").toUpperCase()} ${n}`;
    }
  };

  const fetchTx = async () => {
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const params = new URLSearchParams();
      if (source && source !== "any") params.set("source", source);
      const refClean = refText.trim();
      if (refClean) params.set("ref", refClean);

      const url = `${API_BASE}/api/db/tx${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Unexpected response");
      setRows(data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load transactions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allChecked = useMemo(
    () => rows.length > 0 && selected.size === rows.length,
    [rows.length, selected]
  );

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r._id || r.piId)));
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} record(s)?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/tx/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const out = await res.json();
      if (!res.ok || out.error) throw new Error(out.error || "Delete failed");
      await fetchTx();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  const resetFilters = () => {
    setSource("any");
    setRefText("");
  };

  const onSearch = async (e) => {
    e.preventDefault();
    await fetchTx();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Paymet Records</h1>

      <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border rounded-md h-10 px-3"
          >
            <option value="any">Any</option>
            <option value="hospital">Hospital</option>
            <option value="mart">Mart</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Reference</label>
          <input
            value={refText}
            onChange={(e) => setRefText(e.target.value)}
            placeholder="APPT-123, CART-555, etc."
            className="w-full border rounded-md h-10 px-3"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </button>
          <button
            type="button"
            onClick={() => { resetFilters(); fetchTx(); }}
            className="h-10 px-4 rounded-md border"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {loading ? "Loading..." : `${rows.length} result(s)`}
          {error && <span className="text-red-600 ml-3">{error}</span>}
        </div>
        <button
          onClick={clearSelected}
          disabled={selected.size === 0}
          className={`h-9 px-4 rounded-md ${selected.size ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
        >
          Clear selected
        </button>
      </div>

      <div className="mt-4 overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Reference</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-left">Currency</th>
              <th className="px-3 py-2 text-left">PI ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No records
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const id = r._id || r.piId;
                return (
                  <tr key={id} className="border-t">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleOne(id)}
                        aria-label={`Select ${id}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.source || "—"}</td>
                    <td className="px-3 py-2">{r.ref_id || "—"}</td>
                    <td className="px-3 py-2">{r.description || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          r.status === "succeeded"
                            ? "bg-green-100 text-green-700"
                            : r.status === "processing"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {fmtAmount(r.amount, r.currency)}
                    </td>
                    <td className="px-3 py-2 uppercase">{r.currency || "—"}</td>
                    <td className="px-3 py-2">{r.piId || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
